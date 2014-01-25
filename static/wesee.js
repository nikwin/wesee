var App = function(){
};


var getFrameFunctions = function(){
    app = new App();
    app.initialize();
    return {
        'update': function(){
            var interval = timeFeed.getInterval();
            return app.update(interval);
        },
        'draw': function(){
            app.draw();
        }
    };
};

var main = function(){
    try{
        var functions = getFrameFunctions();
        var tickFun = function(){
            var cont = functions.update();
            functions.draw();
            if (cont){
                requestAnimFrame(tickFun, canvas);
            }
        };
        tickFun();
    }
    catch(e){
        alert(e);
    }
};

window.onload = main;
