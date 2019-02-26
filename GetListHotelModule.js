var jsdom = require('jsdom');
var https = require('https');

module.exports = function (callBack) {

    const url = 'https://www.relaischateaux.com/fr/site-map/etablissements';
    var urlMichelin = 'https://restaurant.michelin.fr/restaurants/france/restaurants-1-etoile-michelin/restaurants-2-etoiles-michelin/restaurants-3-etoiles-michelin/page-'
    var listStarRestaurantMichelin = [];
    var listRelaiChateau = [];
    var listHotelRoom = [];
    var listMichelinImgRest = [];

    var michelinDone = false;
    var relaiChateauDone = false;

    // need to be call here
    getMichelinList = function () {
        for (var i = 1; i < 36; i++) {
            const temp = i;
            jsdom.JSDOM.fromURL(urlMichelin + i).then(domRelai => {

                var list = domRelai.window.document.getElementsByClassName('poi-search-result')[0].getElementsByTagName('li');

                for (var j = 0; j < list.length; j++) {
                    var card = list[j];

                    if (card.getElementsByClassName('poi_card-display-title')[0] != undefined) {

                        var restaurantName = card.getElementsByClassName('poi_card-display-title')[0].innerHTML.trim();

                        if (card.getElementsByClassName('poi_card-picture')[0].getElementsByTagName('img')[0] != undefined) {
                            var img = card.getElementsByClassName('poi_card-picture')[0].getElementsByTagName('img')[0].getAttribute('data-src');
                        }

                        var nbrStars = 0;
                        var stars = card.getElementsByClassName('guide')[0].children[0].className;
                        if (stars.indexOf(1) >= 0) nbrStars = 1;
                        if (stars.indexOf(2) >= 0) nbrStars = 2;
                        if (stars.indexOf(3) >= 0) nbrStars = 3;



                        var rest = { name: restaurantName, img: img, nbrStars: nbrStars };

                        listMichelinImgRest.push(rest);
                        listStarRestaurantMichelin.push(restaurantName);
                    }
                }

                if (temp == 35) {
                    michelinDone = true;
                    console.log("michelin DOne");
                    checkRestaurantName();
                }
            });
        }
    }();

    // need to be call here
    getRelaiChateauList = function () {
        jsdom.JSDOM.fromURL(url).then(domRelai => {

            var temp = domRelai.window.document.getElementsByTagName('li');

            for (var i = 280; i < 430; i++) {
                var restaurantUrl = temp[i].children[0].href;
                var restaurantName = temp[i].children[0].innerHTML.trim();
                var rest = { url: restaurantUrl, name: restaurantName };
                listRelaiChateau.push(rest);

                if (i == 429) {
                    relaiChateauDone = true;
                    console.log("relai chateau done");
                    checkRestaurantName();
                }
            }
        });
    }();


    fetchAvailability = function (hotelRoom, temp, dom) {
        console.log("start fetch availability " + hotelRoom.name);
        var datalayer = JSON.parse(dom.window.document.getElementById('tabProperty').getAttribute('data-gtm-datalayer'));

        hotelRoom.id = datalayer[0].synxis_id;

        // request availability
        var optionsget = {
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        };
        var month = (new Date()).getMonth() + 1;

        var response = [];
        for (var j = 1; j < 13; j++) {

            var urlCalendar = 'https://www.relaischateaux.com/fr/popin/availability/check?month=2019-' + j + '&idEntity=' + hotelRoom.id; + '&pax=2&room=1';

            if (j < month) {
                response.push(null);
            }
            else {
                https.get(urlCalendar, optionsget, function (res) {
                    res.on('data', function (d) {
                        var parsed = JSON.parse(d);

                        var key = Object.values(parsed);
                        response.push(key[0].pricesPerDay);

                        if (response.length == 12) {
                            hotelRoom.availability = response;
                            console.log(hotelRoom.name + ' has finish loading data');
                            checkAllDataLoaded();
                        }
                    });

                    res.on('error', function (err) {
                        console.log(err);
                    });
                });
            }
        }
    }

    checkAllDataLoaded = function () {
        for (var i = 0; i < listHotelRoom.length; i++) {
            if (listHotelRoom[i].availability == undefined || listHotelRoom[i].availability.length < 11) {
                return;
            }
        }
        console.log('all data loaded');
        
        callBack(listHotelRoom);
    }

    getImgSrcFromRestaurantName = function (name) {
        for (var i = 0; i < listMichelinImgRest.length; i++) {
            if (listMichelinImgRest[i].name == name) {
                return listMichelinImgRest[i];
            }
        }
        return null;
    }

    checkRestaurantName = function () {

        if (michelinDone && relaiChateauDone) {
            for (var i = 0; i < listRelaiChateau.length; i++) {
                const temp = i;
                for (var j = 0; j < listStarRestaurantMichelin.length; j++) {
                    if (listStarRestaurantMichelin[j] == listRelaiChateau[i].name) {

                        listRelaiChateau[i].match = true;
                        console.log("match " + listRelaiChateau[i].name);
                        if (listRelaiChateau[i].name != 'Villa René Lalique') {

                            var michelinTemp = getImgSrcFromRestaurantName(listRelaiChateau[temp].name);
                            listRelaiChateau[temp].imgAvatar = michelinTemp.img;
                            listRelaiChateau[temp].nbrStars = michelinTemp.nbrStars;

                            jsdom.JSDOM.fromURL(listRelaiChateau[temp].url).then(dom => {

                                // get item to test if it's a Hotel
                                var nav = dom.window.document.getElementsByClassName('jsSecondNavMain')[0];
                                var hotelSpan = nav.children[0].getElementsByTagName('span')[0];

                                if (hotelSpan != undefined && hotelSpan.innerHTML.trim() == 'Hôtel') {
                                    //c'est un hotel

                                    var imgBackground = 'https:' + dom.window.document.getElementsByClassName('hotelHeader')[0].getElementsByTagName('img')[0].getAttribute('data-src');
                                    var description = dom.window.document.getElementsByClassName('richTextMargin')[0].innerHTML;

                                    listRelaiChateau[temp].description = description;
                                    listRelaiChateau[temp].imgBackground = imgBackground;
                                    listHotelRoom.push(listRelaiChateau[temp]);
                                    fetchAvailability(listRelaiChateau[temp], temp, dom);
                                }
                            });
                        }
                    }
                }
            }
        }

    }
}
