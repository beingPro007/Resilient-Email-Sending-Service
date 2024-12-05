class ApiResonse{
    constructor(statuscode, message = "Successfully Done!!!",data){
        this.statuscode = statuscode
        this.message = message
        this.data = data
        this.success = statuscode < 400
    }
}

export { ApiResonse }