// Put your Microsoft Entra Application (client) ID here.
// Example: const CONFIG = { clientId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" };
const CONFIG = {
  clientId: "PASTE-YOUR-MICROSOFT-CLIENT-ID-HERE",
  authority: "https://login.microsoftonline.com/common",
  redirectUri: window.location.origin + window.location.pathname,
  scopes: ["User.Read", "Files.ReadWrite"]
};