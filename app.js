var fs = require('fs');
var mymodule = require('./GetListHotelModule');



mymodule(function (listHotel) {
    fs.writeFile('data.json', JSON.stringify(listHotel), function (err) {
        if (err) console.log(err);
    });
});






