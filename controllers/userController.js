const bcryptjs = require('bcryptjs');
const { validationResult } = require('express-validator');
const { memoryStorage } = require('multer');

const db = require('../database/models')
const sequelize = db.sequelize
const {Op} = require('sequelize')

const User = db.User
const CategoryUser = db.CategoryUser

const userController = {

        

// CRUD USUARIOS
    register: async (req, res) => {
        let userLogged = req.session.userId
        const users = await CategoryUser.findAll()
       
        return res.render('./users/register',{users,userLogged});
    },
    processRegister: async (req,res) =>{

        const users = await CategoryUser.findAll()

        const resultValidation = validationResult(req);
        let emailExits = req.body.email

        let userInDB = await User.findOne({where:{
            email:emailExits
            }
        });
       
        if (userInDB) {
            res.render('./users/register',{
                errors: [{ email :{msg: 'Este correo electrónico ya existe'}}],
                old: req.body,
                users  
            })
        }

        if(resultValidation.isEmpty() && !userInDB){
        let userToCreate = {
            full_name: req.body.full_name,
            user_name: req.body.user_name,
            email: req.body.email,
            password: bcryptjs.hashSync(req.body.password,10),            
            profile_picture: req.file.filename,
            category_user_id:req.body.category_user_id
            
        } 
        
        
         await User.create(userToCreate)
          return  res.redirect('/user/login')
       } else  {
        const users = await CategoryUser.findAll()
           res.render('./users/register',{
               errors: resultValidation.array(),
               old: req.body,
               users
           })
       }
       

    },

    editUser: async (req,res) =>{
        try {
            let userLogged = req.session.userId
            const id = req.params.id;
        
        const user = await User.findByPk(id)

        res.render('./users/editUsers',{user,userLogged})
            
        } catch (error) {
            console.log(error);
        }
        

    },
    saveEdition: async (req,res) =>{

        try {
            const id = req.params.id

            const userImage = await User.findByPk(id)

            let image = req.file ?  req.file.filename : userImage.profile_picture;
            const {full_name,email,user_name}=req.body

            

            await User.update({
                full_name,
                user_name,
                profile_picture:image,
                email
            },{where: {id:id}})
            
       return res.redirect("/user/profile")
            
        } catch (error) {
            console.log(error);
        }
    },


    //LOGIN USER

    login: (req,res) => {
        let userLogged = req.session.userId

        return res.render('login',{userLogged})
    },

    // Proceso validacion de credenciales login
    loginProcess: async (req, res) => {

        let userLogged = req.session.userId
        let email= req.body.email

        let userTologin = await  User.findOne({where:{
            email:email
            }
        });

        if(userTologin){
            let isOkthePassword = bcryptjs.compareSync(req.body.password, userTologin.password);
            if(isOkthePassword){
                delete userTologin.password;
                req.session.userId = userTologin;

                if(req.body.remember_user) {
                    res.cookie(userTologin, { maxAge: (1000 * 60 ) * 2});
                }

                 return res.redirect("/user/profile")

            }

            return res.render('login', {
                errors: {
                    email: {
                        msg: 'Las credenciales son invalidas'
                    }
                }
            });
        }

        return res.render('login', {
            errors: {
                email: {
                    msg: 'No te encuentras registrado'
                }
            },
            userLogged
        });
    },

   profile: (req,res) => {
    

       return res.render('./users/profile',{userLogged: req.session.userId});
    },

    logout: (req, res) =>{
        let email= req.body.email
        res.clearCookie(email);
        req.session.destroy();
        return res.redirect('/');
    }
}

module.exports = userController;