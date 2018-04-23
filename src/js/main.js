/*global $, jQuery, alert*/


// global variables
const APP_ROOT = 'http://clubs.njit.edu/capstone/RegistrationHelper';
let allClassesStudent;
const classSet = new Set();
const groupSet = new Set();

// @TODO Remove Hardcoded parameters
let ucid = 'mgt23';
let studentMajor = 'Science1';

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
function loadClassPicker(data) {
    let classGroups = '';
    for (let group of groupSet) {
        classGroups +=
            `<div class="column is-12 class-group">
                <button class="button button--class class-group__title">${group}</button>
                <div class="columns is-multiline class-container">`;
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
                    <button class="button button--class is-outlined is-${color}">${cls.class}</button>
                </div>`;
        }
        classGroups +=
                `</div>
            </div>`
        $('.class-group-container').html(classGroups);
    }
}

/*Helper functions*/

// Searches for classes with year/term code and returns them
function getClassesByCode(code) {
    let classArr = [];
    for (let cls of allClassesStudent) {
        if (cls.code === code) {
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
    // @TODO fix bug
    if (!Array.isArray(prereqArray)){
        prereqArray = Array.from(prereqArray);
    }
    return prereqArray.every(isPrerequisiteGroupComplete);
}

// Check class prerequisites for partial completion
function isPrerequisitePartiallyComplete(prereqArray) {
    // Turns prereqArray into an array if it isn't one
    // @TODO fix bug
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
    return -1;
}

// Checks if class is taken
function isTaken(classObj) {
    return classObj.code !== null;
}

// decodes class code
function codeDecode(code) {
    if (code.length > 5) {
        throw new Error(`Check code: ${code} Invalid`);
    }
    let obj = {};
    obj.year = code.substring(0,4);
    obj.term = getTermName(code.substring(4));
    return obj;
}

// encodes class code
function codeEncode(codeObj) {
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

// Loads app after page load
(function loadApp(){
    getAllClassesStudent(ucid, studentMajor)
        .then(setAllClassesStudent)
        .then(createClassSet)
        .then(createGroupSet)
        .then(loadClassPicker);
})();
