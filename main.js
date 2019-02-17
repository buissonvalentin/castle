$('document').ready(function () {
    
    var listAvailableRoomAtDate = [];
    var allData = null;
    var socket = io.connect("http://localhost:8080");

    socket.on('data', function (data) {
        allData = data;
        console.log("data received");
        console.log(allData);
    });

    $("#datePicker").on('change', function (dateText, inst) {
        if(allData == null){
            alert('Veuillez attendre que toutes les données soient chargées');
        }
        else{
            var dateString = $("#datePicker").val();
            var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            var d = new Date(dateString);
            var dayName = days[d.getDay()];
    
            if (dayName == 'Saturday') {
                $("#validDateIcon").removeClass('collapse');
                $("#wrongDateIcon").addClass('collapse');
    
                if (allData != null) {
                    getListFromDate(allData, d);
                }
            }
            else {
                $("#validDateIcon").addClass('collapse');
                $("#wrongDateIcon").removeClass('collapse');
            }
        }
    });

    $('.dropdown-item').on('click', function(ev){
        var value = ev.target.attributes['value'].value;
        if(value == 1){
            listAvailableRoomAtDate.sort(compareName);
            display3CheepestHotel();
        }
        if(value == 2){
            listAvailableRoomAtDate.sort(compareStars);
            display3CheepestHotel();
        }
        if(value == 3){
            listAvailableRoomAtDate.sort(comparePrice);
            display3CheepestHotel();
        }
    });

    getListFromDate = function (listHotel, date) {
        listAvailableRoomAtDate = [];

        var month = date.getMonth();
        var day = date.getDate();

        for (var i = 0; i < listHotel.length; i++) {
            var hotelRoom = listHotel[i];
            var monthObj = hotelRoom.availability[month];
            if ((typeof monthObj === "object") && (monthObj !== null)) {

                var price = undefined;
                for (var j = 0; j < Object.keys(monthObj).length; j++) {
                    if (day == Object.keys(monthObj)[j]) {
                        price = monthObj[Object.keys(monthObj)[i]];
                    }
                }

                if (price != undefined) {
                    hotelRoom.priceAtDate = getPriceValueFromString(price);
                    listAvailableRoomAtDate.push(hotelRoom);
                }
            }
        }
        listAvailableRoomAtDate.sort(comparePrice);
        display3CheepestHotel();
    }

    comparePrice = function (a, b) {
        if (a.priceAtDate < b.priceAtDate)
            return -1;
        if (a.priceAtDate > b.priceAtDate)
            return 1;
        return 0;
    }
    compareName = function (a, b) {
        if (a.name < b.name)
            return -1;
        if (a.name > b.name)
            return 1;
        return 0;
    }
    compareStars = function (a, b) {
        if (a.nbrStars < b.nbrStars)
            return -1;
        if (a.nbrStars > b.nbrStars)
            return 1;
        return 0;
    }

    getPriceValueFromString = function (priceString) {
        var price = Number(priceString.split('$')[1]);
        return price;
    }

    createCard = function (name, price, avatarurl, etoiles) {
        const cardtext = React.createElement('p', { className: 'card-text' }, price + '$');
        const cardTitle = React.createElement('h5', { className: 'card-title text-warning' }, name + '(' + etoiles + ' étoile)');
        const cardBody = React.createElement('div', { className: 'card-body' }, [cardTitle, cardtext]);
        const cardImage = React.createElement('img', { className: 'card-img-top', src: '' + avatarurl }, null);

        const card = React.createElement('div', { className: 'crd card mb-3', style: { margin: "15px" } }, [cardImage, cardBody]);
        return card;
    }

    display3CheepestHotel = function () {        
        var nbrItem = 5;
        var listCard = [];

        for(var i = 0; i < nbrItem; i++){
            if(listAvailableRoomAtDate.length > i){
                listCard.push(createCard(listAvailableRoomAtDate[i].name, listAvailableRoomAtDate[i].priceAtDate, listAvailableRoomAtDate[i].imgAvatar, listAvailableRoomAtDate[i].nbrStars));
            }
        }

        ReactDOM.render(
            listCard,
            document.getElementById('resultContainer')
        );

        $('.crd').on('click', function (e) {
            var hotelName = e.currentTarget.getElementsByClassName('card-title')[0].innerHTML.split('(')[0];
            var hotel = findHotelFromName(hotelName);
            console.log(hotel);
            displayHotelDetails(hotel.name, hotel.description, hotel.priceAtDate, hotel.imgBackground, hotel.url);
        });
    }

    findHotelFromName = function (hName) {
        for (var i = 0; i < listAvailableRoomAtDate.length; i++) {
            if (listAvailableRoomAtDate[i].name == hName) return listAvailableRoomAtDate[i];
        }
        return null;
    }

    displayHotelDetails = function (hotelName, description, price, imgBckgrnd, url) {

        const priceDiv = React.createElement('div', { className: 'text-center', style: { width: '50%', height: '100%', float: 'left' } }, 'Price : ' + price + '$');
        const reserveLink = React.createElement('a', { href: '' + url, target: '_blank', className: 'btn btn-warning', style: { width: '35%', height: '100%', float: 'left' } }, 'Réserver');
        const img = React.createElement('img', { className: 'rounded-top', src: '' + imgBckgrnd, style: { width: '100%', height: '45%' } }, null);
        const hotelTitle = React.createElement('h3', { className: 'text-warning text-center', style: { width: '50%', height: '15%', margin: 'auto', paddingTop: '2%' } }, hotelName)
        const descriptionDiv = React.createElement('div', { style: { fontStyle: 'italic', height: '55%', margin: 'auto', width: '80%', overflowY: 'scroll', fontSize: 'small' } }, description)
        const bottomContainer = React.createElement('div', { style: { margin: 'auto', width: '80%', marginTop: '5%' } }, [priceDiv, reserveLink]);
        const divTextContainer = React.createElement('div', { className: 'rounded-bottom', style: { width: '100%', height: '50%', backgroundColor: 'white' } }, [hotelTitle, descriptionDiv, bottomContainer]);


        ReactDOM.render(
            [img, divTextContainer],
            document.getElementById('detail')
        );
    }

});




