var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var bcrypt = require("bcrypt");
if(process.env.NODE_ENV != "production"){
    var env = require("dotenv")
    var {ATLAS:dbURI} = env.config().parsed;
}else{
    var dbURI = process.env.ATLAS;
}
const SALT_ROUNDS = 10;
var AccountSchema =  new Schema({
    availableDates:[{time:{type:String}}],
    
    title:{type:String},
    bio:{type:String},
    skills:[{type:String}],
    city:{type:String},
    state:{type:String},
    workHistory:[{
        companyName:{type:String},
        jobTitle:{type:String},
        duties:{type:String},
        supervisor:{type:String},
        phone:{type:String},
        canContact:{type:Boolean},
        from:{type:String},
        to:{type:String}
    }],
    interviewer:{type:Boolean, default:false},
    references:[{
        name:{type:String},
        phone:{type:String},
    }],
    firstName:{
        type:String,
        required:true,
    },
    lastName:{
        type:String,
        required:true,
    },
    email:{
        type:String, 
        lowercase:true,
        required:true, 
        unique:true,
        validate:{
            validator(value){
                return /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/g.test(value)
            },
            message:"Invalid email address"
        }
    },
    password:{
        type:String,
        required:true,
        validate:{
            validator(value){
                return /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/gm.test(value);
            },
            message:"Password must be at least 8 characters long, must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number Can contain special characters"           
        },
    },
})
AccountSchema.pre("updateOne", async function(next){
    if(this._update.hasOwnProperty("email")){
        if(this.schema.obj.email.validate.validator(this._update.email)){
            next()
        }else{
            throw Error(this.schema.obj.email.validate.message);
        }
    }
    if(this._update.hasOwnProperty("password")){
        
        //validate password trying to update
        if(this.schema.obj.password.validate.validator(this._update.password)){
            this._update.password = await bcrypt.hash(this._update.password, SALT_ROUNDS);
            next();
        }else{
            throw Error(this.schema.obj.password.validate.message);
        }
       
    }
    next()
})
AccountSchema.pre("save", function(next){
    if(this.isModified("password")){
        this.validate(async (error) => {
            if(!error){
                this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
                next();
            }
        })
    }else{
        next();
    }
})
var connection = mongoose.createConnection(dbURI, {useUnifiedTopology:true, useNewUrlParser:true, useCreateIndex:true});
var AccountModel = connection.model("Account", AccountSchema);
module.exports = AccountModel;