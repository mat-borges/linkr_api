import {authSchema, authSignInSchema} from "../models/userSchemas.js";
import sessionRepository from "../repositories/sessionRepository.js";
import userRepository from "../repositories/userRepository.js";
import bcrypt from "bcrypt";

export function authBodyValidation (req, res, next) {
    const auth = req.body;

    if (!auth) {
        return res.sendStatus(400);
    }

    const { error } = authSchema.validate(auth, { abortEarly: false });

    if (error) {
        const errors = error.details.map((detail) => detail.message);
        return res.status(422).send(errors);
    }
    
    const hashPassword = bcrypt.hashSync(auth.password, 10)

    const user = {
        name: auth.name,
        email: auth.email,
        password: hashPassword,
        image: auth.image
    }

    res.locals.auth = user
    next();
}

export async function checkEmailInDb (req, res, next){
    const auth = res.locals.auth;

    try{
        const emailExist = await userRepository.getUserByEmail(auth.email);

        if(emailExist){
            return res.sendStatus(409);
        }
        
        res.locals.auth = auth;
        next();
    } catch (error){
        return res.status(500).send(error.message);
    }
}
