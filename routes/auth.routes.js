import { Router } from 'express'
import bcrypt from 'bcryptjs'
import User from '../models/User.model.js'
import 'dotenv/config'
import jwt from 'jsonwebtoken'

const authRouter = Router()

authRouter.post('/sign-up', async (req, res) => {
    const { name, email, password } = req.body

    try {

        const userExists = await User.findOne({email})
        if (userExists) {
            throw new Error('User already exists')
        }

        const salt = bcrypt.genSaltSync(+process.env.SALT_ROUNDS)
        const passwordHash = bcrypt.hashSync(password, salt)
        
        const newUser = await User.create({ name, email, passwordHash })
        if(newUser) {
            return res.status(201).json({message: 'User created'})
        }
    } catch (error) {
        console.log(error)

        if(error.message === 'User already exists') {
            return res.status(409).json({message: 'Review your submitted data'})
        }
        return res.status(500).json({message: 'Internal Server Error'})
    }
})

authRouter.post('/login', async (req, res) => {
    const { email, password } = req.body

    try {
        if(!email) {
            throw new Error('No e-mail found')
        }

        if(!password) {
            throw new Error('No password found')
        }

        const user = await User.findOne({email})

        if(!user) {
            throw new Error('User does not exists')
        }

        const passwordMatch = bcrypt.compareSync(password, user.passwordHash)

        if(!passwordMatch) {
            throw new Error('Password does not match')
        }

        const secret = process.env.JWT_SECRET
        const expiresIn = process.env.JWT_EXPIRES

        const token = jwt.sign({id: user._id, email: user.email}, secret, {expiresIn})

        return res.status(200).json({token})
    } catch (error) {
        console.log(error)
        return res.status(401).json({message: 'Not allowed'})
    }
})

export default authRouter