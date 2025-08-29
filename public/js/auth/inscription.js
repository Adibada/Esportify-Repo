// Initialisation
export default function initInscriptionPage() {
    // Récupération des éléments du formulaire par leur ID
    const profilNameInput = document.getElementById("profilNameInput");
    const mailInput = document.getElementById("mailInput");
    const passwordInput = document.getElementById("passwordInput");
    const confirmPasswordInput = document.getElementById("validatePasswordInput");
    const btnValidationInscription = document.getElementById("btn-valid-inscription");

    // Désactivation du bouton 
    btnValidationInscription.disabled = true;

    // Listeners des champs 
    profilNameInput.addEventListener("input", validateForm);
    mailInput.addEventListener("input", validateForm);
    passwordInput.addEventListener("input", validateForm);
    confirmPasswordInput.addEventListener("input", validateForm);

    // Listener du bouton d'inscription
    btnValidationInscription.addEventListener("click", inscrireUser);

    // Vérification du nom
    function validateName(input) {
        const valid = input.value.trim().length > 3 && input.value.trim().length < 30;
        toggleInputClass(input, valid);
        return valid;
    }

    // Vérification de l'adresse mail
    function validateMail(input) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const valid = emailRegex.test(input.value.trim());
        toggleInputClass(input, valid);
        return valid;
    }

    // Vérification du mot de passe
    function validatePassword() {
        const pwd = passwordInput.value.trim();
        const confirmPwd = confirmPasswordInput.value.trim();
        const valid = pwd.length >= 6 && pwd === confirmPwd;

        toggleInputClass(passwordInput, pwd.length >= 6);
        toggleInputClass(confirmPasswordInput, valid);

        return valid;
    }

    // Champs valides ou invalides
    function toggleInputClass(input, isValid) {
        if (isValid) {
            input.classList.remove("is-invalid");
            input.classList.add("is-valid");
        } else {
            input.classList.remove("is-valid");
            input.classList.add("is-invalid");
        }
    }

    // Contrôle du formulaire
    function validateForm() {
        const nomOk = validateName(profilNameInput);
        const mailOk = validateMail(mailInput);
        const passwordOk = validatePassword();

        // Bouton activé si tous les champs sont corrects
        btnValidationInscription.disabled = !(nomOk && mailOk && passwordOk);
    }
 
    // Fonction d'inscription
    function inscrireUser() {
        btnValidationInscription.disabled = true;

        // Préparation des données
        const payload = {
            username: profilNameInput.value.trim(),
            mail: mailInput.value.trim(),
            password: passwordInput.value.trim()
        };

        // Requête POST vers l'API backend
        fetch("http://127.0.0.1:8000/api/registration", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })
            .then(response => {
                if (!response.ok) throw new Error("Erreur HTTP " + response.status);
                return response.json();
            })
            .then(data => {
                console.log("Succès:", data);
                alert("Inscription réussie !");
            })
            .catch(error => {
                console.error("Erreur:", error);
                alert("Échec de l'inscription !");
            })
            .finally(() => {
                btnValidationInscription.disabled = false; // On réactive le bouton
            });
    }
}
