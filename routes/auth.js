const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const userModel = require('./../models/userModel.js')
const contractModel = require('./../models/contractModel.js')

router.use(bodyParser.json())
router.use(bodyParser.urlencoded({ extended: true }))

router.post("/login",(req, res)=> {
	userModel.login(req.body.email, req.body.password)
		.then(foundUserDoc => {
            if (!foundUserDoc) { return Promise.reject('Sellise parooli ja emaili kombinatsiooniga kasutajat ei eksisteeri!') }
            console.log(foundUserDoc.email + " logis sisse " + new Date().toLocaleString())
            return res.json(responseFactory("accept","Oled sisse logitud!"))
        })
        .catch(err => {
            console.log(err)
            return res.json(responseFactory("reject","Sellise parooli ja emaili kombinatsiooniga kasutajat ei eksisteeri!"))
    	})
})
// hash verification - determining if the given hash is associated with an user document
router.get("/verify/:hash",(req, res)=> {
	userModel.verify(req.params.hash)
	    .then(foundUserDoc => {
	        if (!foundUserDoc) { return Promise.reject('ei leidnud kasutajat'); }
	        console.log("found user with email: " + foundUserDoc.email)
	        return res.json(responseFactory("accept",foundUserDoc.email))
    	})
	    .catch(err => {
	        console.log(err)
	        return res.json(responseFactory("accept","Midagi läks valesti... :("))
	    })
})
// user will be validated on successful hash exchange
router.post("/validate",(req, res)=> {
	let rb = req.body
	if(rb.hash && rb.hash.length == 64){
		if(rb.password === rb.cpassword){
			userModel.validate(rb.password, rb.cpassword, rb.hash)
	        .then(returnedUserDoc => {
		        if (!returnedUserDoc) { return Promise.reject('Ei leidnud kasutajat!') }
		        return res.json(responseFactory("accept","Kasutaja valideeritud! (logi sisse nupp vms)"))
		    })
		    .catch(err => {
		        console.log(err)
		        return res.json(responseFactory("reject","Midagi läks valesti... :("))
		    })
		} else {return res.json(responseFactory("reject","Paroolid ei klapi!"))}
	} else {return res.json(responseFactory("reject","Räsi on vigane!"))}
})

router.post("/create",(req, res)=> {
	userModel.create(req.body.email)
	        /* .catch(err) won't catch mongoose errors, however, passing the err argument along the 
	    second callback function (which in turn needed to be added) for .then solved the problem

	    .then((doc)=>{if(doc){return Promise.reject('Sellise parooli ja emaili kombinatsiooniga valideeritud kasutajat ei eksisteeri!')}},)
	        .then(() => sendMagicLink(email, hash))
	            .then(doc => console.log(doc), res.json("emailile saadeti üks maagiline link"))
	    .catch(err => {
	        console.log(err)
	        return res.status(403).send("midagi läks valesti")
	    })*/
	    .then((doc)=>{
	        if(doc){
	            userModel.sendMagicLink(doc.email, doc.hash.hash)
	            return res.json(responseFactory("accept","Valideerimislink saadeti emailile!"))
	        }
	    },
	    (err)=>{
	    	console.log(err)
	    	return res.json(responseFactory("reject","Midagi läks valesti... :("))
	    })
})

router.post("/forgot",(req, res)=> {
	userModel.forgot(req.body.email)
	    .then(user => {
            console.log(user)
            if (!user) { return Promise.reject('Ei leidnud kasutajat!') }
	        return res.json(responseFactory("accept","Valideerimislink saadeti emailile!"))
        })
        .catch(err => {
            console.log(err)
            return res.json(responseFactory("reject","Midagi läks valesti... :("))
        })
})

router.post("/contract/create",(req, res)=>{
	console.log(req.body)
	contractModel.create(
		req.body.email,
		req.body.documents,
		req.body.hinnatabel,
		req.body.contract_creator,
		req.body.created_timestamp, res)
})



const responseFactory = (status, msg)=>{
	return {
		status: status,
		data: {
			msg: msg
		}
	}
}

module.exports = router