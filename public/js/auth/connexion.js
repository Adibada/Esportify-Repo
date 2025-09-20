//Variables enregistrant les inputs
const usernameInput = document.getElementById("usernameInput");
const passInput = document.getElementById("passwordInput");
const validateButton = document.getElementById("loginButton");

//Check du clic sur le bouton de validation
validateButton.addEventListener("click", checkCredential);

//Fonction de vérification des identifiants 
function checkCredential() {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
        "username": usernameInput.value,
        "password": passInput.value
    });

    const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow"
    };

    fetch("/api/login", requestOptions)
        .then((response) => {
            if (!response.ok) throw new Error("Identifiants incorrects");
            return response.json();
        })
        .then((result) => {
            setToken(result.apiToken);
            setCookie("role", result.roles && result.roles[0] ? result.roles[0] : "user", 7);
            setCookie("userId", result.id, 7);
            alert("Connexion réussie !");
            
            // Mettre à jour l'affichage des éléments de navigation
            if (typeof window.editByRoles === 'function') {
                window.editByRoles();
            }
            
            window.location.replace("/");
        })
        .catch((error) => {
            alert("Informations incorrectes, veuillez réessayer.");
        });
}

