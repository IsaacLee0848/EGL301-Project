const searchParams = new URLSearchParams(window.location.search);
const screeningId = searchParams.get("screeningId");
let currentSeats = "";
let currentBookingId = "";

$(async function () {
  let response = await fetch(`/api/screenings/${screeningId}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: sessionStorage.getItem("token"),
    },
  });
  if (!response.ok) {
    $("#screeningError").text(
      "Sorry, there was an error retrieving the screening."
    );
    $("#screeningError").show();
    $("#screeningDetails").hide();
    return;
  }
  const data = await response.json();
  console.log(data);

  if (data) {
    $("#screeningError").hide();
    $("#screeningDetails").show();
  } else {
    $("#screeningError").show();
    $("#screeningDetails").hide();
    return;
  }

  $("#movieName").text(data.movie.name);
  $("#movieRelease").text(data.movie.release);
  $("#movieRuntime").text(`${data.movie.runtime} minutes`);
  $("#movieLanguage").text(data.movie.language);

  $("#screeningStart").text(data.datetime);
  $("#screeningEnd").text(data.datetime);
  $("#screeningCinema").text(data.cinema);
  $("#screeningSeats").text(data.seats);

  if (sessionStorage.token) {
    const userScreeningsResponse = await fetch(
      `/api/screenings/${screeningId}/bookings`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: sessionStorage.getItem("token"),
        },
      }
    );
    if (!userScreeningsResponse.ok) {
      return;
    }
    const userScreenings = await userScreeningsResponse.json();

    if (userScreenings && userScreenings.seats.length > 0) {
      $("#showBookingForm").hide();
      $("#showCurrentBookings").show();
      currentBookingId = userScreenings._id;
      currentSeats = userScreenings.seats.join(", ");
      $("#currentBookings").text(currentSeats);
      $("#unbookSeatsForm").submit(unbookSeats);
    } else {
      console.log("no bookings");
      $("#showBookingForm").show();
      $("#showCurrentBookings").hide();
      $("#bookSeatsForm").submit(bookSeats);
    }
  }
});

async function unbookSeats(e) {
  e.preventDefault();
  let data = new FormData(e.target);
  let bookingEntries = Object.fromEntries(data.entries());
  bookingEntries.screeningId = screeningId;
  let response = await fetch(`/api/bookings/${currentBookingId}`, {
    method: "delete",
    body: JSON.stringify({
      seats: currentSeats,
    }),
    headers: {
      "Content-Type": "application/json",
      Authorization: sessionStorage.getItem("token"),
    },
  });
  if (!response.ok) {
    $("#unbookSeatsStatusMessage").text(
      "Sorry, there was an error unbooking the seats."
    );
    $("#unbookSeatsStatusMessage").show();
    return;
  }
  location.reload();
}

async function bookSeats(e) {
  e.preventDefault();
  let data = new FormData(e.target);
  let bookingEntries = Object.fromEntries(data.entries());
  bookingEntries.screeningId = screeningId;
  console.log(bookingEntries);
  let response = await fetch("/api/bookings", {
    method: "post",
    body: JSON.stringify(bookingEntries),
    headers: {
      "Content-Type": "application/json",
      Authorization: sessionStorage.getItem("token"),
    },
  });
  if (!response.ok) {
    $("#bookSeatsStatusMessage").text(
      "Sorry, there was an error booking the seats."
    );
    $("#bookSeatsStatusMessage").show();
    return;
  }
  // Refresh the page
  location.reload();
}
