const express = require('express');
const Favorite = require('../models/favorite');
const Campsite = require('../models/campsite');
const authenticate = require('../authenticate');
const cors = require('./cors');

const favoriteRouter = express.Router();

favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))

.get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    console.log('===.get favoriteRouter ===');
    console.log('=== req.params ===', req.params);
    console.log('=== req ===', req.user._id);

    Favorite.find( {user: req.user._id } )
    .populate('user')
    .populate('campsite')

    .then(favorites => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favorites);
    })
    .catch(err => next(err));
})

.post(cors.corsWithOptions, authenticate.verifyUser,  (req, res, next) => {
    console.log("=== post ===");
    console.log('=== req.body ===', req.body);
    // check if the user has existing favorites 
    Favorite.findOne( {user: req.user._id} ) 
    .then(response =>  {
        if (response) {
            console.log('=== req.body ===', req.body);
            req.body.forEach(element => {
                if (!response.campsite.map(x => x._id).includes(element._id)) {
                    response.campsite.push(element);
                }
            });

            response.save();
            
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(response);

        } else {
            Favorite.create({user: req.user._id, campsite: []})
            .then(fav => {
                fav.campsite = req.body;
                fav.save();

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(fav);
            });
        }
    })
    
    .catch(err => next(err));
})

.put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites');
})

.delete(cors.corsWithOptions, authenticate.verifyUser,  (req, res, next) => {
    Favorite.findOneAndDelete( {user: req.user._id} )
    .then(response => {
        // found it
        if (response)  {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(response);
        } 
        // Not found
        else  {
            res.statusCode = 201;
            res.setHeader('Content-Type', 'text/plain');
            res.end('You do not have any favorites to delete.');

        }
    })
    .catch(err => next(err));
});

favoriteRouter.route('/:campsiteId')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))

.get(cors.cors, (req, res) => {
    res.statusCode = 403;
    res.end('GET operation not supported on /favorites');
})

.post(cors.corsWithOptions, authenticate.verifyUser,  (req, res, next) => {
    // check if the campsiteId passed is in the Campsite Table 
    Campsite.findById(req.params.campsiteId)
    .then(campsite => {
        if (!campsite) {
            res.statusCode = 201;
            res.setHeader('Content-Type', 'text/plain');
            res.end(`Campsite passed ${req.params.campsiteId} is not found in Campsite Table`);
        } else {
            // check if the user has existing favorites 
            Favorite.findOne( {user: req.user._id} ) 
            .then(response =>  {
                if (response) {
                    console.log('response: ', response);

                    // if campsiteID is not yet there in the Table campsiteId array
                    if (!response.campsite.map(x => x._id).includes(req.params.campsiteId)) {
                        response.campsite.push(req.params.campsiteId);
                        response.save();
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(response);
                    } else {
                        res.statusCode = 201;
                        res.setHeader('Content-Type', 'text/plain');
                        res.end(`The Campsite ${req.params.campsiteId} is already in the list of favorites!`);
                    }
                // User favorite is not there yet    
                } else {
                    Favorite.create({user: req.user._id, campsite: []})
                    .then(fav => {
                        fav.campsite = req.params.campsiteId;
                        fav.save();
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(fav);
                    });
                }
            }) 
        } // .then campsite check    
    })
    
    .catch(err => next(err));
        
})

.put(cors.corsWithOptions, authenticate.verifyUser, (req, res)  => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites');
})

.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    // check if the user has existing favorites 
    Favorite.findOne( {user: req.user._id} ) 

    .then(favorite => {

        // locate the campsiteId array element and "delete"
        // returns the resulting array without the deleted element
        let index1 = favorite.campsite.indexOf(req.params.campsiteId);
        
        // campsiteId found
        if (!(index1 == -1)) {
            favorite.campsite.splice(index1, 1);
            favorite.save();

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(favorite);
        }
        // campsiteId not found 
        else {
            res.statusCode = 201;
            res.setHeader('Content-Type', 'text/plain');
            res.end(`There are no favorites to delete!`);
        } 

    })

    .catch(err => next(err));

});



module.exports = favoriteRouter;