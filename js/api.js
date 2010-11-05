/*
    **NOTE**
    This creates 1 (and only one) object in the Global Namespace:
        HMXSongs
*/

/*Takes an object with user specified properties (OPTIONAL - you can instantiate a new object without passing it anything)
    obj.debug   OPTIONAL    boolean     turn on/off debug mode, defaults to false
    obj.apiURL  OPTIONAL    string      URL to the API if you overide the default
*/
HMXSongs = function(obj) {
    //Sets debug property if passed into instantiation obj
    var debug = (obj && obj.debug) ? obj.debug : false;
    //sets the api property if passed in, otherwise reverts to the default URL
    var apiURL = (obj && obj.apiURL)? obj.apiURL : 'http://atidwell.misc/hmxsongs/';
    

    /*Takes an object with user specified properties
        obj.complete    REQUIRED    function    called after the response from the API
        obj.recache     OPTIONAL    boolean     will force the server to recache the list from HMX, defaults to false
        obj.sorting     OPTIONAL    string      how to sort the results [title, artist, year, genre, difficulty, type, rating, added] defaults to 'title'
        obj.sortOrder   OPTIONAL    string      sort 'ascending' or 'descending', defaults to 'ascending'
    */
    this.getSongs = function(obj) {
        if (checkValidParams({obj: obj, required: ['complete']})) {
            makeJSON({
                method: 'getSongs', 
                complete: obj.complete, 
                params: {
                    recache: obj.recache || false
                }
            });
        }
        else {
            return false;
        }
    };    

    
    /*Internal interface with JSONscriptRequest to make json call*/
    var makeJSON = function(obj) {
        var curlen = HMXSongs.callbackQueue.length;
        HMXSongs.callbackQueue.push(function(data) {
            obj.complete(data);
            if (debug) {
                console.log('API call with callback ID '+curlen+' complete');
            }
        });
        //set up the URL to make the request to
        var requestURL = apiURL+obj.method+'/?callback='+'HMXSongs.callbackQueue['+(curlen)+']';
        //append each of the necessary params
        for (var property in obj.params) {
            if (obj.params.hasOwnProperty(property)) {
                requestURL += '&'+property+'='+obj.params[property];
            }
        }
        //make the request object and do the actual request
        var jsonObj = new JSONscriptRequest(requestURL);
        jsonObj.buildScriptTag();
        jsonObj.addScriptTag();
    };
    
    
    /*The following is an object for use in making the cross-domain json requests to access the API
    This is so that there is no library-dependance.
    Source and Documentation: http://www.xml.com/pub/a/2005/12/21/json-dynamic-script-tag.html?page=1*/
    
    // Constructor -- pass a REST request URL to the constructor
    function JSONscriptRequest(fullUrl) {
        // REST request path
        this.fullUrl = fullUrl; 
        // Keep IE from caching requests
        this.noCacheIE = '&noCacheIE=' + (new Date()).getTime();
        // Get the DOM location to put the script tag
        this.headLoc = document.getElementsByTagName("head").item(0);
        // Generate a unique script tag id
        this.scriptId = 'JscriptId' + JSONscriptRequest.scriptCounter++;
    }
    
    // Static script ID counter
    JSONscriptRequest.scriptCounter = 1;
    
    // buildScriptTag method
    JSONscriptRequest.prototype.buildScriptTag = function () {
        // Create the script tag
        this.scriptObj = document.createElement("script");
        // Add script object attributes
        this.scriptObj.setAttribute("type", "text/javascript");
        this.scriptObj.setAttribute("charset", "utf-8");
        this.scriptObj.setAttribute("src", this.fullUrl + this.noCacheIE);
        this.scriptObj.setAttribute("id", this.scriptId);
    };
     
    // removeScriptTag method
    JSONscriptRequest.prototype.removeScriptTag = function () {
        // Destroy the script tag
        this.headLoc.removeChild(this.scriptObj);  
    };
    
    // addScriptTag method
    JSONscriptRequest.prototype.addScriptTag = function () {
        // Create the script tag
        this.headLoc.appendChild(this.scriptObj);
        if (debug) {
            console.log('API call made to: '+this.scriptObj.src);
        }
    };
    
    /*
        Takes an object with params and check to make sure the user supplied everything right
            params.obj Object Passed in by the user
            params.required Required params array
    */
    var checkValidParams = function(params) {
        //Keeps track of the possible errors to display when in debug mode
        var errors = {
            noObj: "Must supply an object with the valid params",
            noCallback: "Must supply complete property in object passed to method (function complete)"
        };
        var obj = params.obj;
        var required = params.required;
        
        //check to make sure that an object was even passed into the function
        if (typeof(obj) == 'undefined') {
            if (debug) {
                console.log(errors.noObj);
            }
            return false;
        }
        
        var i = 0;
        while (i< required.length) {
            //if we are in debug mode throw the propper error
            if (debug) {
                if ((!obj.complete || typeof(obj.complete) != 'function') && required[i] == 'complete') {
                    console.log(errors.noCallback);
                    return false;
                }
            }
            
            //check to make sure the user passed it in if we arent in debug just in case
            if (typeof(obj[required[i]]) == 'undefined') {
                return false;                    
            }
            i++;
        }
        //if they are all there, were good to go
        return true;
    };

};
/*
Array used to cache callback funtions passed into requests for x-domain json requests (aka API REST REQUESTS).
Note that multiple instances of the HMXSongs object will all use the same Queue.  May have to look into clearing of the queue after making callback if it degenerates into some kind of memory leak
*/
HMXSongs.callbackQueue = [];