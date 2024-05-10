mapboxgl.accessToken = mapToken;
const map = new mapboxgl.Map({
  container: "map", // container ID
  style: "mapbox://styles/mapbox/navigation-night-v1", // style URL
  center: campground.coordinates, // starting position [lng, lat]
  zoom: 10, // starting zoom
});

map.addControl(new mapboxgl.NavigationControl());

// adding marker on map
new mapboxgl.Marker()
  .setLngLat(campground.coordinates)
  .setPopup(
    new mapboxgl.Popup({ offset: 25 }).setHTML(
      `<h6>${campground.title}</h6><p>${campground.location}</p><p>₹${campground.price}/night</p>`
    )
  )
  .addTo(map);
