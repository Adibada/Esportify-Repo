//Variables enregistrant les inputs
const mailInput = document.getElementById("emailInput");
const passInput = document.getElementById("passwordInput");
const validateButton = document.getElementById("loginButton");

//Check du clic sur le bouton de validation
validateButton.addEventListener("click, checkCredential")

//Fonction de vérification des identifiants 
function checkCredential() {
//Appel API

    if(mailInput.value == "a" && passInput.value == "a") {
        alert("Connexion réussie !");

        const token = "connected_token";
        setToken(token);

        setCookie("role", "admin", 7);

        window.location.replace("/");
}
    else {
        alert("Informations incorrectes, veuillez réessayer.");
    }
}