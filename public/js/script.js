const socket = io();



if(navigator.geolocation){
    navigator.geolocation.watchPosition((position) => {
      const {latitude,longitude} = position.coords;
      socket.emit("send-location",{username,latitude,longitude});

      // Emit location data to the server
      socket.emit("send-location", {username, latitude, longitude });

      // Send location data to the backend for saving in the database
      fetch('/save-location', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ latitude, longitude })
      })
      .then(response => response.json())
      .then(data => {
          console.log("Location saved to database", data);
      })
      .catch(error => {
          console.error("Error saving location", error);
      });

    },
    (error) => {
        console.error(error);
    },
    {
        enableHighAccuracy:true,
        timeout:4000,
        maximumAge:0, 
    }
);
}

const map=L.map("map").setView([0,0],16);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{
    attribution :"OpenStreetMap"
}).addTo(map)

const markers={};

socket.on("receive-location", (data)=>{
    const {id,latitude,longitude} = data;
    map.setView([latitude,longitude],16);
    if(markers[id]){
        markers[id].setLatLng([latitude,longitude]);
    }
    else{
      markers[id]=L.marker([latitude,longitude]).addTo(map);
    }
});

socket.on("user-disconnected",(id) => {
    if(markers[id]){
        map.removeLayer(markers[id]);
        delete markers[id];
    }
})