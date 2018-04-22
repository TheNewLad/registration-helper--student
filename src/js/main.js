/*global $, jQuery, alert*/


// global variables
const APP_ROOT = 'http://clubs.njit.edu/capstone/RegistrationHelper';
let allClassesStudent;

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
}

/*
*  Helper functions
*/


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
        .then(setAllClassesStudent);
})();
