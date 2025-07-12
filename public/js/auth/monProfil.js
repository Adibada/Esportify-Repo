//Fonction pour le bouton modification de profil 
function modifyAccount() {
    navigate("/modifierProfil");
}

//Fonction pour le bouton déconnexion
function signOut() {
  eraseCookie(tokenCookieName);
  eraseCookie(roleCookieName);
  if (typeof navigate === "function") {
    navigate("/connexion");
  } else {
    console.error("navigate() n'est pas défini !");
  }
}

// Attacher les événements aux boutons
function attachProfilePageEvents() {
  const modifyAccButton = document.getElementById("modifyAccountBtn");
  const signoutButton = document.getElementById("signoutBtn");
  const deleteButton = document.getElementById("deleteAccountBtn"); // à implémenter si nécessaire

  if (modifyAccButton) {
    modifyAccButton.addEventListener("click", modifyAccount);
  }

  if (signoutButton) {
    signoutButton.addEventListener("click", signOut);
  }

  if (deleteButton) {
    deleteButton.addEventListener("click", () => {
    });
  }
}

attachProfilePageEvents();
