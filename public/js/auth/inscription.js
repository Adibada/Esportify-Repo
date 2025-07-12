//Variables enregistrant les inputs
const profilNameInput = document.getElementById("profilNameInput");
const emailInput = document.getElementById("emailInput");
const birthDateInput = document.getElementById("birthDateInput");
const passwordInput = document.getElementById("passwordInput");
const confirmPasswordInput = document.getElementById("validatePasswordInput");

//Checkup de changement dans les inputs
profilNameInput.addEventListener("change", validateForm);
emailInput.addEventListener("change", validateForm);
birthDateInput.addEventListener("change", validateForm);
passwordInput.addEventListener("change", validateForm);
confirmPasswordInput.addEventListener("change", validateForm);

//Fonction de formulaire entièrement valide
function validateForm() {
    validateName(profilNameInput);
    validateEmail(emailInput);
    validateBirthDate(birthDateInput);
    validateName(passwordInput);
    validatePassword(confirmPasswordInput);
}

//Fonction de validation des inputs texte
function validateName(input) {
    if (input.value.length > 3 && input.value.length < 30) {
        input.classList.remove("is-invalid");
        input.classList.add("is-valid");
    } else {
        input.classList.remove("is-valid");
        input.classList.add("is-invalid");
    }
}
//Fonction de validation de l'input email
function validateEmail(input) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const userEmail = emailInput.value;
    if (userEmail.match(emailRegex)) {
        input.classList.remove("is-invalid");
        input.classList.add("is-valid");
    } else {
        input.classList.remove("is-valid");
        input.classList.add("is-invalid");
    }
}

//Fonction de validation de l'input date
function validateBirthDate(input) {
    const birthDate = new Date(input.value);
    const today = new Date();
    if (input.value && birthDate < today) {
        input.classList.remove("is-invalid");
        input.classList.add("is-valid");
    } else {
        input.classList.remove("is-valid");
        input.classList.add("is-invalid");
    }
}

//Fonction de validation de l'input mot de passe
function validatePassword(input) {
    if (confirmPasswordInput.value === passwordInput.value) {
        input.classList.remove("is-invalid");
        input.classList.add("is-valid");
    } else {
        input.classList.remove("is-valid");
        input.classList.add("is-invalid");
    }
}