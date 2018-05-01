/*global $, alert*/


// global variables
const APP_ROOT = 'http://clubs.njit.edu/capstone/RegistrationHelper';
let allClassesStudent;
const classSet = new Set();
const groupSet = new Set();
let currentSemester = {}; //{term: 'Spring', year: 2018};
let previousSemester = {}; //{term: 'Spring', year: 2018};
let editMode = false;

// @TODO Remove Hardcoded parameters
let ucid = 'mgt23';
let studentMajor = 'Science1';
let password = '';

// Fill in javascript variables
$('.js-major__name').text(studentMajor);

// @TODO Remove next 2 lines if not needed
// $('.js-year').text(currentSemester.year);
// $('.js-term').text(currentSemester.term);

// Closes message guide
$('.message--guide .delete').on('click', () => {
    $('.message--guide').addClass('is-hidden');
});

// Gets all Classes for student
function getAllClassesStudent(ucid, major) {
    return new Promise( resolve => {
        $.post(
            `${APP_ROOT}/getAllClassesStudent--karim.php`,
            {
                'ucid': ucid,
                'major': major
            },
            function (data) {
                if (data.success) {
                    resolve(data.return);
                }
            }
        );
    });
}

// Sets class data after data fetch
function setAllClassesStudent(data) {
    allClassesStudent = data;
    return Promise.resolve(data);
}

// Creates class set from class student data
function createClassSet(data) {
    for (let cls of data) {
        classSet.add(cls.class);
    }
    return Promise.resolve(data);
}

// Creates class set from class student data
function createGroupSet(data) {
    for (let cls of data) {
        groupSet.add(cls.group);
    }
    return Promise.resolve(data);
}

// Loads up class picker using data from API
function loadClassPicker() {
    let classGroups = '';
    for (let group of groupSet) {
        classGroups +=
            `<div class="column is-12 class-group">
                <button class="button button--group class-group__title">${group}</button>
                <div class="columns is-multiline class-container" style="display: none;">`;
        let inGroup = getClassesByGroup(group);
        for (let cls of inGroup) {
            let color = getClassColor(cls);

            classGroups +=
                `<div class="buttons has-addons button--class">
                    <span class="button is-small button--class__name is-outlined is-${color}">${cls.class}</span>
                    <span class="button is-small is-info class-info" data-class="${cls.class}"><i class="fas fa-info-circle"></i></span>
                </div>`;
        }
        classGroups +=
                `</div>
            </div>`;
        $('.class-group-container').html(classGroups);
    }
}

// Toggle class visibility
$('.class-group-container').on('click', '.button--group', event => {
    $(event.currentTarget).next().slideToggle();
});

// Checks class to be added to current semester editor
$('.class-group-container').on('click', '.button--class__name', event => {
    let className = $(event.currentTarget).text();
    if (isCompleted(findClass(className)) === 3) {
        $('.modal--class-message .modal-content')
            .html(generateClassMessageModal('warning', className));
        $('.modal--class-message')
            .addClass('is-active');
    } else if (isCompleted(findClass(className)) === 2) {
        addClassToSemester(className);
    } else if (isCompleted(findClass(className)) < 2) {
        $('.modal--class-message .modal-content')
            .html(generateClassMessageModal('error', className));
        $('.modal--class-message')
            .addClass('is-active');

    }
});

// Adds class to selected semester
function addClassToSemester(className) {
    if ($.isEmptyObject(currentSemester) || objectToCode(currentSemester) === '9999F0') {
        $('.modal--class-message .modal-content')
            .html(generateClassMessageModal('error--class'));
        $('.modal--class-message')
            .addClass('is-active');
    } else {
        $(`.js-${objectToCode(currentSemester)}`).append( () => {
            let year = currentSemester.year;
            let term = currentSemester.term;
            return `<div class="buttons has-addons button--class">
                                            <span class="button is-small button--class__name is-outlined is-${getClassColor(className)}" data-year="${year}" data-term="${term}" data-overridden="0">${className}</span>
                                            <span class="button is-small is-info class-info" data-class="${className}"><i class="fas fa-info-circle"></i></span>
                                            <span class="button is-small button--delete-class is-danger"><i class="fas fa-trash"></i></span>
                                        </div>`;
        });
        $('.modal--class-message')
            .removeClass('is-active');
    }
}

// Adds class to selected semester
function addClassToOverride(className) {
    if ($.isEmptyObject(currentSemester)) {
        $('.modal--class-message .modal-content')
            .html(generateClassMessageModal('error--class'));
        $('.modal--class-message')
            .addClass('is-active');
    } else {
        $(`.js-9999F0, .js-${objectToCode(currentSemester)}`).append( () => {
            let year = currentSemester.year;
            let term = currentSemester.term;
            return `<div class="buttons has-addons button--class">
                                            <span class="button is-small button--class__name is-outlined is-${getClassColor(className)}" data-year="${year}" data-term="${term}" data-overridden="1">${className}</span>
                                            <span class="button is-small is-info class-info" data-class="${className}"><i class="fas fa-info-circle"></i></span>
                                            <span class="button is-small button--delete-class is-danger"><i class="fas fa-trash"></i></span>
                                        </div>`;
        });
        $('.modal--class-message')
            .removeClass('is-active');
    }
}

// Loads class info when button is clicked
$('body').on('click', '.class-info', event => {
    let className = $(event.currentTarget).data().class;
    let classObj = findClass(className);

    // Set modal class info
    $('.js-modal__class').text(classObj.class);
    $('.js-modal__description').text(classObj.description);
    $('.js-modal__semester').text(() => {
        return codeToString(classObj.code);
    });
    $('.js-modal__prerequisite-list').html(prerequisitesToHTML(classObj.prereqs));

    // Opens modal
    $('.modal--class-info').addClass('is-active');
});

// Closes modal
$('.modal-close, .modal-background').on('click', () => {
    $('.modal--class-info, .modal--class-message, .modal--guide').removeClass('is-active');
});

// Load semesters with classes
function loadSemesters(data) {
    let semesters = '';
    for (let year = 2018; year <= 2021; year++) { // y: year
        for (let t = 0; t <= 1; t++) { // t: term
            let term = t === 0 ? 'Spring' : 'Fall';
            semesters +=
                `<div class="column is-one-quarter semester-container">
                    <div class="box box--semester">
                        <div class="semester">
                            <p class="semester__title">${term} ${year}</p>
                                    <div class="column column--button is-12 js-${objectToCode({year: year, term: term})}">`;

            let classArr = getClassesByCode(year + term.substring(0,1));
            for (let cls of classArr) {
                let codeObj = codeToObject(cls.code);
                let year = codeObj.year;
                let term = codeObj.term;
                let override = codeObj.overridden;
                semesters +=
                                        `<div class="buttons has-addons button--class">
                                            <span class="button is-small button--class__name is-outlined is-${getClassColor(cls.class)}" data-year="${year}" data-term="${term}" data-overridden="${override}">${cls.class}</span>
                                            <span class="button is-small is-info class-info" data-class="${cls.class}"><i class="fas fa-info-circle"></i></span>
                                        </div>`;
            }

            semesters +=
                                    `</div>
                        </div>
                        <div class="buttons buttons-semester buttons--edit">
                            <span class="button is-small is-success edit-button"  data-year="${year}" data-term="${term}">Edit</span>
                            
</div>
                        <div class="buttons buttons-semester  buttons--clear-submit is-hidden">
                            <span class="button is-small is-danger clear-button"  data-year="${year}" data-term="${term}">Clear</span>
                            <span class="button is-small is-info submit-button"  data-year="${year}" data-term="${term}">Submit</span>                            
</div>
                        
                    </div>
                </div>`;


        }
    }
    $('.js-planner').html(semesters);

    semesters = '';
    let classArr = getOverriddenClasses();
    for (let cls of classArr) {
        let codeObj = codeToObject(cls.code);
        let year = codeObj.year;
        let term = codeObj.term;
        let override = codeObj.overridden;
        semesters +=
            `<div class="buttons button--class has-addons">
                                            <span class="button is-small button--class__name is-outlined is-${getClassColor(cls.class)}" data-year="${year}" data-term="${term}" data-overridden="${override}">${cls.class}</span>
                                            <span class="button is-small is-info class-info" data-class="${cls.class}"><i class="fas fa-info-circle"></i></span>
                                        </div>`;
    }
    $('.js-9999F0').html(semesters);
    return Promise.resolve(data);
}

// Selects semester for editing
$('.js-planner, .override').on('click', '.edit-button', event => {
    editMode = true;
    let selectedSemester = $(event.currentTarget).data();
    if (compareSemesters(previousSemester, selectedSemester) === -1) {
        previousSemester = currentSemester;
        currentSemester = selectedSemester;
    }
    $('.semester-container .box').removeClass('box--selected');
    $(event.currentTarget).parents('.box--semester').addClass('box--selected');

    let arrX = [];
    $(`.js-${objectToCode(selectedSemester)} .button--class__name`)
        .each(function() {
            let cls = $(this).text();
            arrX.push({
                name: cls,
                ucid: ucid,
                major: studentMajor
            });
        });
    $.post(
        `${APP_ROOT}/revertStudentRecords--karim.php`,
        {
            'x': arrX
        },
        data => {
            if (data.success) {
                $(event.currentTarget)
                    .parent()
                    .addClass('is-hidden')
                    .siblings('.buttons--clear-submit')
                    .removeClass('is-hidden');
                $('.edit-button').addClass('is-hidden');
                reloadClassPicker();
            }
        }
    );
    if (objectToCode(currentSemester) === '9999F0') {
        $('.js-year').text('Override');
    } else {
        $('.js-year').text(currentSemester.year);
        $('.js-term').text(currentSemester.term);
    }

    $(`.js-${objectToCode(selectedSemester)} .buttons.has-addons`)
        .append('<span class="button is-small button--delete-class is-danger"><i class="fas fa-trash"></i></span>');
});

// Clears semester in editing
$('.js-planner, .override').on('click', '.clear-button', () => {

    $(`.js-${objectToCode(currentSemester)}`)
        .empty();
});


//Submits semester in editing
$('.js-planner, .override').on('click', '.submit-button', event => {
    editMode = false;
    $('.submit-button').addClass('is-loading');
    let arrX = [];
    $(`.js-${objectToCode(currentSemester)} .button--class__name`)
        .each(function() {
            let cls = $(this).text();
            arrX.push({
                name: cls,
                code: objectToCode($(this).data()),
                ucid: ucid,
                major: studentMajor
            });
            // TODO Remove if not needed
            // console.log(objectToCode($(this).data()));
        });
    $.post(
        `${APP_ROOT}/updateStudentRecords--karim.php`,
        {
            'x': arrX
        },
        data => {
            if (data.success) {
                $(event.currentTarget)
                    .parent()
                    .addClass('is-hidden')
                    .siblings('.buttons--edit')
                    .removeClass('is-hidden');
                $('.semester-container .box')
                    .removeClass('box--selected');
                currentSemester = {};
                $('.js-year').empty();
                $('.js-term').empty();
                $('.edit-button').removeClass('is-hidden');
            }
        }
    );
    $(`.js-${objectToCode(currentSemester)} .button--delete-class`).remove();
    $('.submit-button').removeClass('is-loading');
    setTimeout(reloadApp, 500);

});

// Delete button to remove class
$('.js-planner, .override').on('click', '.button--delete-class', event => {
    $(event.currentTarget)
        .parent()
        .remove();
});


/*Helper functions*/

// Returns an HTML list representation of class prerequisites
function prerequisitesToHTML(prereqs) {
    let html = '';
    // Turns prereqArray into an array if it isn't one
    // @TODO fix bug where prereq isn't an array
    if (!Array.isArray(prereqs)){
        prereqs = Array.from(prereqs);
    }
    for (let prereq of prereqs) {
        if (prereq.logic === 'OR') {
            html += '<li class="prerequisite-item">Take One: [';
            for (let course of prereq.course) {
                if (isTaken(course)) {
                    html += `<span class="has-text-link has-text-weight-semibold is-italic">${course.prereq}</span>`;
                } else {
                    html += `${course.prereq}`;
                }
                html += ', ';
            }
            html += ']</li>';
        } else if (prereq.logic === 'AND') {
            html += '<li class="prerequisite-item">Take All: [';
            for (let course of prereq.course) {
                if (isTaken(course)) {
                    html += `<span class="has-text-link has-text-weight-semibold is-italic">${course.prereq}</span>`;
                } else {
                    html += `${course.prereq}`;
                }
                html += ', ';
            }
            html += ']</li>';
        }
    }
    return html;
}

// Searches for classes with year/term code and returns them
function getClassesByCode(code) {
    let semObj = code;
    if (typeof semObj === 'string') {
        semObj = codeToObject(semObj);
    }
    let year = semObj.year;
    let term = semObj.term;
    let classArr = [];
    for (let cls of allClassesStudent) {
        if (cls.code === null) {
            continue;
        }
        let clsObj = codeToObject(cls.code);
        let y = clsObj.year;
        let t = clsObj.term;
        if (t === term && y === year) {
            classArr.push(cls);
        }
    }
    return classArr;
}

// Searches for classes with year/term code and returns them
function getOverriddenClasses(code) {
    let semCode = code;
    if (typeof semCode === 'object') {
        semCode = objectToCode(semCode);
    }
    let classArr = [];
    for (let cls of allClassesStudent) {
        if (isOverridden(cls.code)) {
            classArr.push(cls);
        }
    }
    return classArr;
}

// Searches for classes in a GUR group and returns them
function getClassesByGroup(group) {
    if (!isGroup(group)) {
        throw new Error(`Could not find class: ${group}`);
    }
    let classArr = [];
    for (let cls of allClassesStudent) {
        if (cls.group === group) {
            classArr.push(cls);
        }
    }
    return classArr;
}

// Group Exist
function isGroup(className) {
    return groupSet.has(className);
}



// Determine class color
function getClassColor(className) {
    switch (isCompleted(className)) {
    case 3:
        return 'link';
    case 2:
        return 'success';
    case 1:
    case 0:
        return 'danger';
    }
}

/*
* Checks class completeness
* returns:
*   0: prerequisites incomplete; cannot take course
*   1: prerequisites partially complete; cannot take course
*   2: prerequisites complete but course not; can take course
*   3: course taken
*/
function isCompleted(classObj) {
    const cls = typeof classObj === 'object' ? classObj : findClass(classObj);
    const prereqs = cls.prereqs;
    if (isTaken(classObj) && (prereqs !== undefined)) {
        if (isPrerequisiteComplete(prereqs)) {
            return 3;
        } else {
            if (!isOverridden(cls.code) && !editMode) {
                revertOneClass(cls.class);
                return 0;
            } else {
                return 3;
            }


        }
    } else if (prereqs === undefined
        || prereqs.length === 0) {
        return 2;
    } else {
        if (isPrerequisiteComplete(prereqs)) {
            return 2;
        } else if (isPrerequisitePartiallyComplete(prereqs)) {
            return 1;
        }
    }

    return 0;
}

// Check class prerequisites for completion
function isPrerequisiteComplete(prereqArray) {
    // Turns prereqArray into an array if it isn't one
    // @TODO fix bug where prereq is an array
    if (Array.isArray(prereqArray) || prereqArray.length === 0 || prereqArray === undefined) {
        return prereqArray.every(isPrerequisiteGroupComplete);
    }
    else if (!Array.isArray(prereqArray)){
        prereqArray = Array.from(prereqArray);
    }
    return prereqArray.every(isPrerequisiteGroupComplete);
}

// Check class prerequisites for partial completion
function isPrerequisitePartiallyComplete(prereqArray) {
    // Turns prereqArray into an array if it isn't one
    // @TODO fix bug where prereq isn't an array
    if (!Array.isArray(prereqArray)){
        prereqArray = Array.from(prereqArray);
    }
    return prereqArray.some(isPrerequisiteGroupComplete);
}


// Check prerequisite group for completion
function isPrerequisiteGroupComplete(logicGroup) {
    const logic = logicGroup.logic;
    const course = logicGroup.course;
    let complete = false;

    switch (logic) {
    case 'OR':
        complete = course.some(isTaken);
        break;
    case 'AND':
        complete = course.every(isTaken);
        break;
    }

    return complete;
}

// Class Exist
function isClass(className) {
    return classSet.has(className);
}

// Find class in array of classes
function findClass(className) {
    if (!isClass(className)) {
        throw new Error(`Could not find class: ${className}`);
    }
    for (let classObj of allClassesStudent) {
        if (classObj.class === className) {
            return classObj;
        }
    }
    return undefined;
}

// Find class index in array of classes
function findClassIndex(className) {
    if (!isClass(className)) {
        throw new Error(`Could not find class: ${className}`);
    }
    for (let i = 0; i < allClassesStudent.length; i++) {
        if (allClassesStudent[i].class === className) {
            return i;
        }
    }
    return -1;
}

// Checks if class is taken
function isTaken(classObj) {
    if (typeof classObj === 'object') {
        return classObj.code !== null;
    } else {
        return findClass(classObj).code !== null;
    }

}

// decodes class code
function codeToObject(code) {
    if (code.length > 6) {
        throw new Error(`Check code: ${code} Invalid`);
    }
    let obj = {};
    obj.year = code.substring(0,4);
    obj.term = getTermName(code.substring(4,5));
    obj.overridden = Number(code.substring(5));
    return obj;
}

// encodes class code
function objectToCode(codeObj) {
    let code = '';
    code += codeObj.year;
    code += getTermLetter(codeObj.term);
    code += codeObj.overridden === undefined ? 0 : codeObj.overridden;
    return code;
}

// Returns semester code as a legible string
function codeToString(code) {
    let str ='';


    if (code === null) {
        return 'N/A';
    } else if (isOverridden(code)) {
        let codeObj = codeToObject(code);
        str = `${codeObj.term} ${codeObj.year}; Overridden`;
    } else {
        let codeObj = codeToObject(code);
        str = `${codeObj.term} ${codeObj.year}`;
    }

    return str;
}

// Checks if class is overridden
function isOverridden(code) {
    if (code === null ) {
        return false;
    }
    if (typeof code === 'string') {
        code = codeToObject(code);
    }
    return code.overridden === 1;
}

// Gets term name from letter
function getTermName(termLetter) {
    let term;
    switch (termLetter) {
    case 'S':
        term = 'Spring';
        break;
    case 'F':
        term = 'Fall';
        break;
    }
    return term;
}

// Gets term letter from name
function getTermLetter(termName) {
    let term;
    switch (termName) {
    case 'Spring':
        term = 'S';
        break;
    case 'Fall':
        term = 'F';
        break;
    }
    return term;
}

// Compares semesters for sorting
function compareSemesters(a, b) {
    if ($.isEmptyObject(a) && $.isEmptyObject(b)) {
        return 0;
    } else if ($.isEmptyObject(a) && !$.isEmptyObject(b)) {
        return -1;
    } else if (!$.isEmptyObject(a) && $.isEmptyObject(b)) {
        return 1;
    } else if (a.year !== b.year) {
        return a.year < b.year ? -1 : 1;
    } else if (a.year === b.year && a.term !== b.term) {
        return a.term === 'Spring' ? -1 : 1;
    }
    return 0;
}

// Generates Error/Warning Message
function generateClassMessageModal(messageType, className = '') {
    let html = '';

    switch (messageType) {
    case 'error':
        html = `<article class="message is-danger">
                <div class="message-header">
                    <p>Error!</p>
                    <button class="delete is-hidden" aria-label="delete"></button>
                </div>
                <div class="message-body">
                    You do not have the required prerequisites to take this class. If you have a permit to take this class, please add the respective class to the Override by clicking <em>Add to Override</em>, otherwise close this dialogue.
                    <p><button class="button" onclick="addClassToOverride('${className}')">Add to Override</button></p>
                    <div><ul class="prerequisite-list js-modal__prerequisite-list">${prerequisitesToHTML(findClass(className).prereqs)}</ul></div>
                </div>
            </article>`;
        break;
    case 'error--class':
        html = `<article class="message is-danger">
            <div class="message-header">
                <p>Error!</p>
                <button class="delete is-hidden" aria-label="delete"></button>
            </div>
            <div class="message-body">
                No semester chosen.
            </div>
        </article>`;
        break;
    case 'warning':
        html = `<article class="message is-warning">
                <div class="message-header">
                    <p>Warning!</p>
                    <button class="delete is-hidden" aria-label="delete"></button>
                </div>
                <div class="message-body">
                    You have taken this class before. If this wasn't a mistake click <em>Continue</em>, otherwise close this dialogue.
                    <p><button class="button" onclick="addClassToSemester('${className}')">Continue</button></p>
                </div>
            </article>`;
        break;
    }

    return html;
}

// Assigns variables that will be used to load app
function assignVariables() {
    ucid = $('.js-login__ucid').val();
    password = $('.js-login__password').val();
    studentMajor = $('.js-login__select option:selected').val();
    loadApp(); reloadApp();
}

// Reverts one class to null
function revertOneClass(className) {
    $.post(
        `${APP_ROOT}/revertStudentRecords--karim.php`,
        {
            x: [
                {
                    name: className,
                    ucid: ucid,
                    major: studentMajor
                }
            ]
        },
        data => {
            if (data.success) {
                reloadApp();
            }
        }
    );
}

// Gets majors to select from
function getMajors() {
    $.getJSON(
        `${APP_ROOT}/getAllMajors.php`,
        data => {
            let majorHTML = '';
            for (let major of data) {
                majorHTML += `<option>${major}</option>`;
            }
            $('.js-login__select').html(majorHTML);
        }
    );
} getMajors();

// Displays App after load
function unhideApp() {
    $('.login').addClass('is-hidden');
    $('.section--helper, .greeting').removeClass('is-hidden');
    $('.js-ucid').text(ucid);
    $('.modal--guide').addClass('is-active');
}

// Fixes prereqs
function fixPrerequisites(data) {
    for (let i = 0; i < allClassesStudent.length; i++){
        if (!Array.isArray(allClassesStudent[i].prereqs)) {
            let newPrereq = [];
            let prereqs = allClassesStudent[i].prereqs;
            for (let obj in prereqs) {
                newPrereq.push(prereqs[obj]);
            }
            allClassesStudent[i].prereqs = newPrereq;
        }
    }
    return Promise.resolve(data);
}

// Loads app after page load
function loadApp(){
    getAllClassesStudent(ucid, studentMajor)
        .then(setAllClassesStudent)
        .then(createClassSet)
        .then(createGroupSet)
        .then(fixPrerequisites)
        .then(loadClassPicker)
        .then(loadSemesters)
        .then(unhideApp);
}

function reloadApp() {
    getAllClassesStudent(ucid, studentMajor)
        .then(setAllClassesStudent)
        .then(createClassSet)
        .then(createGroupSet)
        .then(fixPrerequisites)
        .then(loadClassPicker)
        .then(loadSemesters);
}

function reloadClassPicker() {
    getAllClassesStudent(ucid, studentMajor)
        .then(setAllClassesStudent)
        .then(createClassSet)
        .then(createGroupSet)
        .then(fixPrerequisites)
        .then(loadClassPicker);
}

/* @TODO Known Bugs
* + Semester selection border moves even when you can't edit that semester
* + Can edit multiple without submitting current semester
* */
