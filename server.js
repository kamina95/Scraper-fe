//Import the express and url modules
var express = require('express');
const cors = require('cors');
var url = require("url");

//Status codes defined in external file
require('./http_status.js');

//The express module is a function. When it is executed it returns an app object
var app = express();
app.use(cors());
//Import the mysql module
var mysql = require('mysql');

//Create a connection object with the user details
var connectionPool = mysql.createPool({
    connectionLimit: 2,
    host: "localhost",
    user: "root",
    password: "yourpassword",
    database: "products",
    debug: false
});

//Set up the application to handle GET requests sent to the user path
app.get('/graphic_cards/*', handleGetRequest);//Subfolders
app.get('/graphic_cards', handleGetRequest);

//Start the app listening on port 8080ms
app.listen(8080);


/* Handles GET requests sent to web service.
   Processes path and query string and calls appropriate functions to
   return the data. */
function handleGetRequest(request, response){
    //Parse the URL
    var urlObj = url.parse(request.url, true);

    //Extract object containing queries from URL object.
    var queries = urlObj.query;

    //Get the pagination properties if they have been set. Will be  undefined if not set.
    var numItems = queries['pageSize'];
    var pageNum = queries['page'];

    //Split the path of the request into its components
    var pathArray = urlObj.pathname.split("/");

    //Get the last part of the path
    var pathEnd = pathArray[pathArray.length - 1];

    if(pathArray[pathArray.length - 2] === "search_model"){
        getGraphicCardsModelCount(response, pathEnd, numItems, pageNum);
        return;
    }

    //If the last part of the path is a valid user id, return data about that user
    var regEx = new RegExp('^[0-9]+$');//RegEx returns true if string is all digits.
    if(regEx.test(pathEnd) && pathArray[pathArray.length - 2] === "graphic_cards"){
        getGraphicCardByIdCount(response, pathEnd, numItems, pageNum);
        return;
    }

    // //If path ends with 'cereals' we return all cereals
    // if(pathEnd === 'graphic_cards'){
    //     getGraphicCardsCount(response, numItems, pageNum);//This function calls the getAllCereals function in its callback
    //     return;
    // }

    // //If path ends with cereals/, we return all cereals
    // if (pathEnd === '' && pathArray[pathArray.length - 2] === 'graphic_cards'){
    //     getGraphicCardsCount(response, numItems, pageNum);//This function calls the getAllCereals function in its callback
    //     return;
    // }

    //The path is not recognized. Return an error message
    response.status(HTTP_STATUS.NOT_FOUND);
    response.send("{error: 'Path not recognized', url: " + request.url + "}");
}


/** When retrieving all cereals we start by retrieving the total number of cereals
    The database callback function will then call the function to get the cereal data
    with pagination */



    /** Returns the cereal with the specified ID */
function getGraphicCardByIdCount(response, id, numItems, pageNum){
    var sql = "SELECT COUNT(*) " +
    "FROM brand INNER JOIN comparison ON comparison.id_brand = brand.id " +
    "WHERE brand.id=" + id;
    //" ORDER BY comparison.price ASC";

    connectionPool.query(sql, function (err, result) {

        //Check for errors
        if (err){
            //Not an ideal error code, but we don't know what has gone wrong.
            console.error("SQL Error:", err);  // Log the full error object
            response.status(HTTP_STATUS.INTERNAL_SERVER_ERROR);
            response.json({'error': true, 'message': err.message});
            return;
        }

        //Get the total number of items from the result
        var totNumItems = result[0]['COUNT(*)'];
        console.log(totNumItems);
        //Call the function that retrieves all cereals
        getGraphicCard(response, id, totNumItems, numItems, pageNum);
    });
}

/** Returns the cereal with the specified ID */
function getGraphicCard(response, id, totNumItems, numItems, pageNum){
    var sql = "SELECT  brand.brand, comparison.url, comparison.price " +
    "FROM brand INNER JOIN comparison ON comparison.id_brand = brand.id " +
    "WHERE brand.id=" + id;
    if(numItems !== undefined && pageNum !== undefined ){
        var offset = (pageNum - 1) * numItems;
        sql += " ORDER BY comparison.price ASC LIMIT " + numItems + " OFFSET " + offset;
    }
    console.log(sql);
    connectionPool.query(sql, function (err, result) {

        if (err){
            //Not an ideal error code, but we don't know what has gone wrong.
            console.error("SQL Error:", err);  // Log the full error object
            response.status(HTTP_STATUS.INTERNAL_SERVER_ERROR);
            response.json({'error': true, 'message': err.message});
            return;
        }
        var returnObj = {totNumItems: totNumItems};
        returnObj.comparison = result; //Array of data from database
        //Output results in JSON format
        response.json(returnObj);
    });
}

function getGraphicCardsModelCount(response, model, numItems, pageNum){
    var sql = "SELECT COUNT(*) " +
    "FROM graphic_cards INNER JOIN brand ON brand.id_product = graphic_cards.id " +
    "WHERE graphic_cards.model='" + model + "'";

    //Execute the query and call the anonymous callback function.
    connectionPool.query(sql, function (err, result) {

        //Check for errors
        if (err){
            //Not an ideal error code, but we don't know what has gone wrong.
            console.error("SQL Error:", err);  // Log the full error object
            response.status(HTTP_STATUS.INTERNAL_SERVER_ERROR);
            response.json({'error': true, 'message': err.message});
            return;
        }

        //Get the total number of items from the result
        var totNumItems = result[0]['COUNT(*)'];
        //console.log(totNumItems);
        //Call the function that retrieves all cereals
        getGraphicCardByModel(response, model, totNumItems, numItems, pageNum);
    });
}

function getGraphicCardByModel(response, model, totNumItems, numItems, pageNum){

    //Build SQL query to select cereal with specified id.
    var sql = "SELECT graphic_cards.model, brand.brand, graphic_cards.description, brand.img_url, brand.id " +
    "FROM graphic_cards INNER JOIN brand ON brand.id_product = graphic_cards.id " +
    "WHERE graphic_cards.model='" + model + "' ";

    if(numItems !== undefined && pageNum !== undefined ){
        var offset = (pageNum - 1) * numItems;
        sql += " LIMIT " + numItems + " OFFSET " + offset;
    }
    console.log(sql);
    //Execute the query
    connectionPool.query(sql, function (err, result) {

        //Check for errors
        if (err){
            //Not an ideal error code, but we don't know what has gone wrong.
            console.error("SQL Error:", err);  // Log the full error object
            response.status(HTTP_STATUS.INTERNAL_SERVER_ERROR);
            response.json({'error': true, 'message': err.message});
            return;
        }

        var returnObj = {totNumItems: totNumItems};
        returnObj.graphicCards = result; //Array of data from database

        //Return results in JSON format
        response.json(returnObj);
    });
}


/** Returns all of the cereals, possibly with a limit on the total number of items returned and the offset (to
 *  enable pagination). This function should be called in the callback of getTotalCerealsCount  */
    // function getAllGraphic(response, totNumItems, numItems, pageNum){
    //     var sql = "SELECT graphic_cards.model, brand.brand, graphic_cards.description, brand.img_url " +
    //     "FROM graphic_cards " + 
    //     "INNER JOIN brand ON brand.id_product = graphic_cards.id ";
    //     //Limit the number of results returned, if this has been specified in the query string
    //     if(numItems !== undefined && pageNum !== undefined ){
    //         sql += "ORDER BY cereals.id LIMIT " + numItems + " OFFSET " + offset;
    //     }
    
    //     //Execute the query
    //     connectionPool.query(sql, function (err, result) {
    
    //         //Check for errors
    //         if (err){
    //             //Not an ideal error code, but we don't know what has gone wrong.
    //             console.error("SQL Error:", err);  // Log the full error object
    //             response.status(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    //             response.json({'error': true, 'message': err.message});
    //             return;
    //         }
    
    //         //Create JavaScript object that combines total number of items with data
    //         var returnObj = {totNumItems: totNumItems};
    //         returnObj.graphicCards = result; //Array of data from database
    
    //         //Return results in JSON format
    //         response.json(returnObj);
    //     });
    // }

    
// function getGraphicCardsCount(response, numItems, pageNum){
//     var sql = "SELECT COUNT(*) FROM graphic_cards";

//     //Execute the query and call the anonymous callback function.
//     connectionPool.query(sql, function (err, result) {

//         //Check for errors
//         if (err){
//             //Not an ideal error code, but we don't know what has gone wrong.
//             console.error("SQL Error:", err);  // Log the full error object
//             response.status(HTTP_STATUS.INTERNAL_SERVER_ERROR);
//             response.json({'error': true, 'message': err.message});
//             return;
//         }

//         //Get the total number of items from the result
//         var totNumItems = result[0]['COUNT(*)'];

//         //Call the function that retrieves all cereals
//         getAllGraphic(response, totNumItems, numItems, pageNum);
//     });
// }

