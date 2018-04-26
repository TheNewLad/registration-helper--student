/*global $, jQuery, alert*/


// global variables
const APP_ROOT = 'http://clubs.njit.edu/capstone/RegistrationHelper';
let allClassesStudent;
const classSet = new Set();
const groupSet = new Set();
let currentSemester = {term: 'Spring', year: 2018};
let previousSemester = {term: 'Spring', year: 2018};

// @TODO Remove Hardcoded parameters
let ucid = 'mgt23';
let studentMajor = 'Science1';

// Fill in javascript variables
$('.js-major__name').text(studentMajor);
$('.js-year').text(currentSemester.year);
$('.js-term').text(currentSemester.term);

// Closes modal
$('.modal-close').on('click', () => {
    $('.modal').removeClass('is-active');
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
            let color = '';
            switch (isCompleted(cls)) {
            case 3:
                color = 'link';
                break;
            case 2:
                color = 'success';
                break;
            case 1:
            case 0:
                color = 'danger';
                break;
            }

            classGroups +=
                `<div class="column column--button is-12">
                    <div class="buttons has-addons button--class">
                        <span class="button button--class__name is-outlined is-${color}">${cls.class}</span>
                        <span class="button is-info class-info" data-class="${cls.class}"><i class="fas fa-info-circle"></i></span>
                    </div>
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

// Adds class to current semester editor
$('.class-group-container').on('click', '.button--class__name', event => {
    let className = $(event.currentTarget).text();
    console.log(findClass(className));
});

// Loads class info when button is clicked
$('body').on('click', '.class-info', event => {
    let className = $(event.currentTarget).data().class;
    let classObj = findClass(className);

    // Set modal class info
    $('.js-modal__class').text(classObj.class);
    $('.js-modal__description').text(classObj.description);
    $('.js-modal__semester').text(() => {
        return classObj.code ? classObj.code : 'N/A';
    });
    $('.js-modal__prerequisite-list').html(prerequisitesToHTML(classObj.prereqs));

    // Opens modal
    $('.modal').addClass('is-active');
});

// Load semesters with classes
function loadSemesters(data) {
    let semesters = '';
    for (let year = 2018; year <= 2023; year++) { // y: year
        for (let t = 0; t <= 1; t++) { // t: term
            let term = t === 0 ? 'Spring' : 'Fall';
            semesters +=
                `<div class="column is-one-quarter semester-container">
                    <div class="box">
                        <div class="semester">
                            <p class="semester__title">${year} ${term}</p>
                            <div class="semester__class-container">
                                <div class="columns is-multiline class-container">
                                    <div class="column column--button is-12">`;

            let classArr = getClassesByCode({'year': year, 'term': term});
            for (let cls of classArr) {
                semesters +=
                                        `<div class="buttons has-addons">
                                            <span class="button button--class__name">${cls.class}</span>
                                            <span class="button is-info class-info" data-class="${cls.class}"><i class="fas fa-info-circle"></i></span>
                                        </div>`;
            }

            semesters +=
                                    `</div>
                                </div>
                            </div>
                        </div>
                        <button class="button is-danger edit-button"  data-year="${year}" data-term="${term}">Edit</button>
                    </div>
                </div>`;


        }
    }
    $('.js-planner').html(semesters);
    return Promise.resolve(data);
}

// Selects semester for editing
$('.js-planner').on('click', '.edit-button', event => {
    let selectedSemester = $(event.currentTarget).data();
    console.log(selectedSemester);
    console.log(compareSemesters(previousSemester, selectedSemester));
    if (compareSemesters(previousSemester, selectedSemester) === -1) {
        previousSemester = currentSemester;
        currentSemester = selectedSemester;
    }
    $('.js-year').text(currentSemester.year);
    $('.js-term').text(currentSemester.term);
});

/*Helper functions*/

// Returns an HTML list representation of class prerequisites
function prerequisitesToHTML(prereqs) {
    let html = '';
    for (let prereq of prereqs) {
        if (prereq.logic === 'OR') {
            html += '<li class="prerequisite-item">Take One: [';
            for (let course of prereq.course) {
                if (isTaken(course)) {
                    html += `<span class="has-text-link is-italic">${course.prereq}</span>`;
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
                    html += `<span class="has-text-link is-italic">${course.prereq}</span>`;
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
    let semCode = code;
    if (typeof semCode === 'object') {
        semCode = objectToCode(semCode);
    }
    let classArr = [];
    for (let cls of allClassesStudent) {
        if (cls.code === semCode) {
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

/*
* Checks class completeness
* returns:
*   0: prerequisites incomplete; cannot take course
*   1: prerequisites partially complete; cannot take course
*   2: prerequisites complete but course not; can take course
*   3: course taken
*/
function isCompleted(classObj) {
    const prereqs = classObj.prereqs;
    if (isTaken(classObj)) {
        return 3;
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
    if (!Array.isArray(prereqArray)){
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

// Find class from array of classes
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

// Checks if class is taken
function isTaken(classObj) {
    return classObj.code !== null;
}

// decodes class code
function codeToObject(code) {
    if (code.length > 5) {
        throw new Error(`Check code: ${code} Invalid`);
    }
    let obj = {};
    obj.year = code.substring(0,4);
    obj.term = getTermName(code.substring(4));
    return obj;
}

// encodes class code
function objectToCode(codeObj) {
    let code = '';
    code += codeObj.year;
    code += getTermLetter(codeObj.term);
    return code;
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
    if (a.year !== b.year) {
        return a.year < b.year ? -1 : 1;
    } else if (a.year === b.year && a.term !== b.term) {
        return a.term === 'Spring' ? -1 : 1;
    }
    return 0;
}

// Loads app after page load
function loadApp(){
    getAllClassesStudent(ucid, studentMajor)
        .then(setAllClassesStudent)
        .then(createClassSet)
        .then(createGroupSet)
        .then(loadClassPicker)
        .then(loadSemesters);
}loadApp();
