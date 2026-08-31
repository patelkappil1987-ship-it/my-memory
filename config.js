// My Memory — Microsoft Entra configuration
const CONFIG = {
  clientId: "a1a7cc52-17d7-4058-be06-34ba4877fc20",

  authority: "https://login.microsoftonline.com/common",

  // Microsoft Entra SPA redirect
  redirectUri: window.location.origin,

  // Permissions configured in Microsoft Entra
  scopes: [
    "User.Read",
    "Files.ReadWrite.AppFolder"
  ]
};
