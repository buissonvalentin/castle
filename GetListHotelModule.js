var jsdom = require('jsdom');
var https = require('https');
var fs = require('fs');

module.exports = function (callBack) {

    const url = 'https://www.relaischateaux.com/fr/site-map/etablissements';
    var urlMichelin = 'https://restaurant.michelin.fr/restaurants/france/restaurants-1-etoile-michelin/restaurants-2-etoiles-michelin/restaurants-3-etoiles-michelin/page-'
    var listStarRestaurantMichelin = [];
    var listRelaiChateau = [];
    var listHotelRoom = [];
    var listMichelinImgRest = [];

    var michelinDone = false;
    var relaiChateauDone = false;
    var count = 0;
    var dataLoaded = false;

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
                count++;
                //console.clear();
                console.log("michelin(" + count + "/35)");

                if (temp == 35) {
                    michelinDone = true;
                    checkRestaurantName();
                }
            });
        }
    }
    getMichelinList();

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
                    checkRestaurantName();
                }
            }
        });
    }
    getRelaiChateauList();

    checkRestaurantName = function () {
        var count = 0;
        if (michelinDone && relaiChateauDone) {
            console.log('nbr relai chateau : ' + listRelaiChateau.length);
            console.log('nbr michelin : ' + listStarRestaurantMichelin.length);
            for (var i = 0; i < listRelaiChateau.length; i++) {

                var goodValue = false;
                var othervalue = '';
                const temp = i;
                if (listStarRestaurantMichelin.indexOf(listRelaiChateau[temp].name) >= 0) {
                    goodValue = true;
                    var michelinTemp = getImgSrcFromRestaurantName(listRelaiChateau[temp].name);
                    listRelaiChateau[temp].imgAvatar = michelinTemp.img;
                    listRelaiChateau[temp].nbrStars = michelinTemp.nbrStars;
                    jsdom.JSDOM.fromURL(listRelaiChateau[temp].url).then(dom => {

                        // get item to test if it's a Hotel
                        var nav = dom.window.document.getElementsByClassName('jsSecondNavMain')[0];
                        var hotelSpan = nav.children[0].getElementsByTagName('span')[0];

                        if (hotelSpan != undefined && hotelSpan.innerHTML.trim() == 'Hôtel') {
                            //c'est un hotel

                            var imgBackground = 'https:' + dom.window.document.getElementsByClassName('hotelHeader')[0].getElementsByTagName('img')[0].getAttribute('data-src');// [2].getAttribute('src');
                            var description = dom.window.document.getElementsByClassName('richTextMargin')[0].innerHTML;

                            listRelaiChateau[temp].description = description;
                            listRelaiChateau[temp].imgBackground = imgBackground;
                            listHotelRoom.push(listRelaiChateau[temp]);
                            fetchAvailability(listRelaiChateau[temp], temp, dom);
                        }
                    });
                }
                // else{
                //     jsdom.JSDOM.fromURL(listRelaiChateau[temp].url).then(dom => {

                //         // get item to test if it's a Hotel
                //         var nav = dom.window.document.getElementsByClassName('jsSecondNavMain')[0];
                //         var hotelSpan = nav.children[0].getElementsByTagName('span')[0];

                //         if (hotelSpan != undefined && hotelSpan.innerHTML.trim() == 'Hôtel') {

                //             if(nav.children[1].getElementsByTagName('span')[0] != undefined && nav.children[1].getElementsByTagName('span')[0].innerHTML.trim() == 'Restaurant'){

                //                 var imgBackground = 'https:' + dom.window.document.getElementsByClassName('hotelHeader')[0].getElementsByTagName('img')[0].getAttribute('data-src');// [2].getAttribute('src');
                //                 var description = dom.window.document.getElementsByClassName('richTextMargin')[0].innerHTML;

                //                 listRelaiChateau[temp].description = description;
                //                 listRelaiChateau[temp].imgBackground = imgBackground;
                //                 listHotelRoom.push(listRelaiChateau[temp]);
                //                 fetchAvailability(listRelaiChateau[temp], temp, dom);

                                
                //                 jsdom.JSDOM.fromURL(nav.children[1].getElementsByTagName('a').getAttribute('href')).then(domRest => {

                //                    var resto = domRest.window.document.getElementsByClassName('mainTitle2')[0].innerHTML;
                //                    console.log(resto);
                //                 });
                //             }
                //             //c'est un hotel

                            
                //         }
                //     });
                // }
                else if (listRelaiChateau[temp].name == "Abbaye de la Bussière") othervalue = 'Abbaye de la Bussière';
                else if (listRelaiChateau[temp].name == "Château de la Treyne") othervalue = 'Château de la Treyne';
                else if (listRelaiChateau[temp].name == "Auberge de l’Île Barbe") othervalue = 'Auberge de l’Île Barbe';
                else if (listRelaiChateau[temp].name == "Auberge des Glazicks") othervalue = 'Auberge des Glazicks';
                else if (listRelaiChateau[temp].name == "Auberge du Jeu de Paume") othervalue = 'Auberge du Jeu de Paume';
                else if (listRelaiChateau[temp].name == "Baumanière Hôtel & Spa") othervalue = 'Baumanière Hôtel & Spa';
                else if (listRelaiChateau[temp].name == "Brittany & Spa") othervalue = 'Brittany & Spa';
                else if (listRelaiChateau[temp].name == "Château Lafaurie-Peyraguey Hôtel & Restaurant LALIQUE") othervalue = 'Château Lafaurie-Peyraguey Hôtel & Restaurant LALIQUE';
                else if (listRelaiChateau[temp].name == "Château de Bagnols") othervalue = 'Château de Bagnols';
                else if (listRelaiChateau[temp].name == "Château de Berne") othervalue = 'Château de Berne';
                else if (listRelaiChateau[temp].name == "Château de La Chèvre d’Or") othervalue = 'Château de La Chèvre d’Or';
                else if (listRelaiChateau[temp].name == "Château de Mercuès") othervalue = 'Château de Mercuès';
                else if (listRelaiChateau[temp].name == "Château de Mirambeau") othervalue = 'Château de Mirambeau';
                else if (listRelaiChateau[temp].name == "Château de Montreuil") othervalue = 'Château de Montreuil';
                else if (listRelaiChateau[temp].name == "Château de Valmer") othervalue = 'Château de Valmer';
                else if (listRelaiChateau[temp].name == "Château d’Adoménil") othervalue = 'Château d’Adoménil';
                else if (listRelaiChateau[temp].name == "Clarance Hôtel") othervalue = 'Clarance Hôtel';
                else if (listRelaiChateau[temp].name == "Domaine Les Crayères") othervalue = 'Domaine Les Crayères';
                else if (listRelaiChateau[temp].name == "Domaine d’Auriac")         othervalue = 'Domaine d’Auriac';         
                else if (listRelaiChateau[temp].name == "Georges Blanc Parc & Spa")  othervalue = 'Georges Blanc Parc & Spa';
                else if (listRelaiChateau[temp].name == "Hameau Albert Ier")  othervalue = 'Hameau Albert Ier';
                else if (listRelaiChateau[temp].name == "Hotel & Restaurant Thierry Drapeau")  othervalue = 'Hotel & Restaurant Thierry Drapeau';
                else if (listRelaiChateau[temp].name == "Hotel Ile de la Lagune Thalasso & Spa")  othervalue = 'Hotel Ile de la Lagune Thalasso & Spa';
                else if (listRelaiChateau[temp].name == "Hôtel & Spa du Castellet")  othervalue = 'Hôtel & Spa du Castellet';
                else if (listRelaiChateau[temp].name == "Hôtel Les Barmes de l'Ours")  othervalue = "Hôtel Les Barmes de l'Ours";
                else if (listRelaiChateau[temp].name == "Hôtel Restaurant Auberge du Père Bise – Jean Sulpice")  othervalue = 'Hôtel Restaurant Auberge du Père Bise – Jean Sulpice';
                else if (listRelaiChateau[temp].name == "Hôtel Restaurant Clos des Sens - Laurent PETIT")  othervalue = 'Hôtel Restaurant Clos des Sens - Laurent PETIT';
                else if (listRelaiChateau[temp].name == "Hôtel du Bois Blanc")  othervalue = 'Hôtel du Bois Blanc';
                else if (listRelaiChateau[temp].name == "Hôtel et Restaurant Régis et Jacques Marcon")  othervalue = 'Hôtel et Restaurant Régis et Jacques Marcon';
                else if (listRelaiChateau[temp].name == "Hôtel-Spa La Bouitte – Restaurant René et Maxime Meilleur")  othervalue = 'Hôtel-Spa La Bouitte – Restaurant René et Maxime Meilleur';
                else if (listRelaiChateau[temp].name == "La Bastide Saint-Antoine")  othervalue = 'La Bastide Saint-Antoine';
                else if (listRelaiChateau[temp].name == "La Bastide de Saint-Tropez")  othervalue = 'La Bastide de Saint-Tropez';
                else if (listRelaiChateau[temp].name == "La Chapelle Saint-Martin")  othervalue = 'La Chapelle Saint-Martin';
                else if (listRelaiChateau[temp].name == "La Côte Saint Jacques & Spa")  othervalue = 'La Côte Saint Jacques & Spa';
                else if (listRelaiChateau[temp].name == "La Ferme Saint-Siméon")  othervalue = 'La Ferme Saint-Siméon';
                else if (listRelaiChateau[temp].name == "La Maison d'Uzès")  othervalue = "La Maison d'Uzès";
                else if (listRelaiChateau[temp].name == "La Maison des Bois – Marc Veyrat")  othervalue = 'La Maison des Bois – Marc Veyrat';
                else if (listRelaiChateau[temp].name == "La Pyramide Patrick Henriroux")  othervalue = 'La Pyramide Patrick Henriroux';
                else if (listRelaiChateau[temp].name == "La Signoria & Spa")  othervalue = 'La Signoria & Spa';
                else if (listRelaiChateau[temp].name == "La Villa Archange")  othervalue = 'La Villa Archange';
                else if (listRelaiChateau[temp].name == "Le Chambard")  othervalue = 'Le Chambard';
                else if (listRelaiChateau[temp].name == "Le Château de Beaulieu")  othervalue = 'Le Château de Beaulieu';
                else if (listRelaiChateau[temp].name == "Le Couvent des Minimes Hôtel & Spa L'Occitane")  othervalue = "Le Couvent des Minimes Hôtel & Spa L'Occitane";
                else if (listRelaiChateau[temp].name == "Le Grand Véfour")  othervalue = 'Le Grand Véfour'; 
                else if (listRelaiChateau[temp].name == "Le Petit Nice-Passedat")  othervalue = 'Le Petit Nice-Passedat';
                else if (listRelaiChateau[temp].name == "Le Phébus & Spa - Villa des Anges")  othervalue = 'Le Phébus & Spa - Villa des Anges';
                else if (listRelaiChateau[temp].name == "Le Prieuré Baumanière")  othervalue = 'Le Prieuré Baumanière';
                else if (listRelaiChateau[temp].name == "Le Relais Bernard Loiseau – Spa Loiseau des Sens")  othervalue = 'Le Relais Bernard Loiseau – Spa Loiseau des Sens';
                else if (listRelaiChateau[temp].name == "Le Saint-James Bouliac")  othervalue = 'Le Saint-James Bouliac';
                else if (listRelaiChateau[temp].name == "Le Suquet, Sébastien Bras")  othervalue = 'Le Suquet, Sébastien Bras';
                else if (listRelaiChateau[temp].name == "Les Hauts de Loire")  othervalue = 'Les Hauts de Loire';
                else if (listRelaiChateau[temp].name == "Les Maisons de Bricourt")  othervalue = 'Les Maisons de Bricourt';
                else if (listRelaiChateau[temp].name == "Les Prés d’Eugénie - Maison Guérard")  othervalue = 'Les Prés d’Eugénie - Maison Guérard';
                else if (listRelaiChateau[temp].name == "L’Arnsbourg Restaurant et Hôtel")  othervalue = "L’Arnsbourg Restaurant et Hôtel";
                else if (listRelaiChateau[temp].name == "L’Hôtel de Toiras & Villa Clarisse")  othervalue = "L’Hôtel de Toiras & Villa Clarisse";
                else if (listRelaiChateau[temp].name == "Maison Doucet")  othervalue = 'Maison Doucet';
                else if (listRelaiChateau[temp].name == "Maison Pic")  othervalue = 'Maison Pic';
                else if (listRelaiChateau[temp].name == "Monte-Carlo Beach")  othervalue = 'Monte-Carlo Beach';
                else if (listRelaiChateau[temp].name == "Moulin de l’Abbaye")  othervalue = "Moulin de l’Abbaye";
                else if (listRelaiChateau[temp].name == "Royal Champagne Hotel & Spa")  othervalue = 'Royal Champagne Hotel & Spa';
                else if (listRelaiChateau[temp].name == "Troisgros")  othervalue = 'Troisgros';
                else if (listRelaiChateau[temp].name == "Villa Florentine")  othervalue = 'Villa Florentine';
                else if (listRelaiChateau[temp].name == "Yoann Conte – Bord du Lac Hôtel Restaurant")othervalue = 'Yoann Conte – Bord du Lac Hôtel Restaurant';
                if(!goodValue){
                    jsdom.JSDOM.fromURL(listRelaiChateau[temp].url).then(dom => {

                        // get item to test if it's a Hotel
                        var nav = dom.window.document.getElementsByClassName('jsSecondNavMain')[0];
                        var hotelSpan = nav.children[0].getElementsByTagName('span')[0];

                        if (hotelSpan != undefined && hotelSpan.innerHTML.trim() == 'Hôtel') {
                            //c'est un hotel

                            var imgBackground = 'https:' + dom.window.document.getElementsByClassName('hotelHeader')[0].getElementsByTagName('img')[0].getAttribute('data-src');// [2].getAttribute('src');
                            var description = dom.window.document.getElementsByClassName('richTextMargin')[0].innerHTML;

                            listRelaiChateau[temp].restaurant = othervalue;
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

    fetchAvailability = function (hotelRoom, temp, dom) {
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
                dataLoaded = false;
                return;
            }
        }
        console.log('all data loaded');
        dataLoaded = true;
        fs.writeFile('data.json', JSON.stringify(listHotelRoom), function (err) {
            if (err) console.log(err);
        });
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
}
