

export default class ErrorHandler{

    handle(err, form){
        switch(err){
            case "Username-short":
                form && form.resetFields(["username"]);
                return "sign-up-error-username-short";
            case "Username-long":
                form && form.resetFields(["username"]);
                return "sign-up-error-username-long";
            case "Already-exist":
                form && form.resetFields(["username"]);
                return "sign-up-error-already-exist";
            case "Password-Invalid":
                form && form.resetFields(["password", "passwordConfirm"]);
                return "sign-up-error-password-invalid";
            case "Incorrect-Login":
                form && form.resetFields(["username", "password"]);
                return "sign-in-error-incorrect-credentials";
            case "Error-Image":
                return "elaborate-error-image";
            case "No-Elaboration-Type":
                return "select-types-error";
            case "No-Image-Selected":
                return "select-img-error";
            case "Wrong-File-Format":
                return "file-format-error";
            default:
                return "generic-error";
        }
    }
}