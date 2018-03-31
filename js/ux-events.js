/* eslint-env jquery */
/* global WebAuthnApp */

"use strict";

(function() {
    var webAuthnConfig = {
        timeout: 30000
        // appName
    };

    function getUsernameFromEvent(event) {
        var usernameInput = $(event.target).children("input[name=username]");

        var msg = null;
        if (!usernameInput[0]) {
            msg = "internal error finding username";
        }

        var username = usernameInput[0].value;
        if (typeof username !== "string" ||
            username.length < 1) {
            msg = "Please enter a username";
        }

        if (msg) {
            var result = {
                success: false,
                msg: "Please enter a username"
            };
            var eRegComplete = new CustomEvent("webauthn-register-complete", { detail: result });
            document.dispatchEvent(eRegComplete);
            throw new Error("username not set");
        }

        return username;
    }

    $("#register-form").submit(function(event) {
        event.preventDefault();
        console.log("Register form submit.");
        // get username
        webAuthnConfig.username = getUsernameFromEvent(event);

        new WebAuthnApp(webAuthnConfig)
            .register()
            .then(function(resp) {
                console.log("Registration complete:", resp);
            });
    });

    $("#login-form").submit(function(event) {
        event.preventDefault();
        console.log("Login form submit.");
        // get username
        webAuthnConfig.username = getUsernameFromEvent(event);

        new WebAuthnApp(webAuthnConfig)
            .login()
            .then(function(resp) {
                console.log("Login complete:", resp);
            });
    });

    document.addEventListener("webauthn-not-supported", function(e) {
        console.log("caught webauthn not supported:", e);

        console.log("event detail", e.detail);
        $("#notSupportedModal").modal("show");
        // change modal body to the message received from the event
        $("#notSupportedBody").html(e.detail);
        // disable "Register" and "Login" buttons
        $("#registerButton").prop("disabled", true);
        $("#loginButton").prop("disabled", true);
    });

    document.addEventListener("webauthn-user-presence-start", function() {
        console.log("caught user presence start!");
        $("#upModal").modal("show");
    });

    document.addEventListener("webauthn-user-presence-done", function() {
        console.log("caught user presence done!");
        $("#upModal").modal("hide");
    });

    $(document).on("webauthn-register-complete", completeListener.bind(null, "Registration"));
    document.addEventListener("webauthn-login-complete", completeListener.bind(null, "Login"));

    function completeListener(type, e) {
        console.log(`Caught ${type} complete!`);
        console.log("e", e);

        // $("#resultHeader").html(`<h3>${type} Complete</h3>`);
        $("#resultHeader").text(`${type} Complete`);

        var body;
        var result = e.detail;
        if (result.success) {
            body = `<h3 class="alert-success">Success!</h3>`;
        } else {
            body = `<h3 class="alert-danger">Failed!</h3>`;
        }
        body += `<p>${result.msg}</p>`;
        $("#resultBody").html(body);

        // if modal is still visible...
        // var viz = $('#upModal').is(':visible');
        var viz = ($("#upModal").data("bs.modal") || {})._isShown;
        if (viz) {
            console.log("modal still visble");
            // ...wait for modal to hide
            $("upModal").on("hidden.bs.modal", function() {
                $("#resultModal").modal("show");
            });
        } else {
            console.log("hiding...");
            $("#resultModal").modal("show");
        }
    }

    // be nice to users by selecting the username input on load and when tabs change
    $(document).ready(function() {
        $("#register-form#username").focus();
        $("a[data-toggle=\"tab\"]").on("shown.bs.tab", function(e) {
            $("input[name=username]", $(e.target).attr("data-target")).focus();
        });
    });
}());
