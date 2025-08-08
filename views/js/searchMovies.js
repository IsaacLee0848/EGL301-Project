$(async function () {


    const searchParams = new URLSearchParams(window.location.search);
    const movieId = searchParams.get("movieId");

    let response = await fetch(`/api/movies/${movieId}`, {
        headers: {
            "Content-Type": "application/json",
            Authorization: sessionStorage.getItem("token"),
        },
    });
    if (!response.ok) {
        $("#movieError").text("Sorry, there was an error retrieving the movie.");
        $("#movieError").show();
        $("#movieDetails").hide();
        return;
    }
    const data = await response.json();
    console.log(data);

    if (data) {
        $("#movieError").hide();
        $("#movieDetails").show();
    } else {
        $("#movieError").show();
        $("#movieDetails").hide();
    return;
    }

    $("#movieName").text(data.name);
    $("#movieRelease").text(data.release);
    $("#movieRuntime").text(`${data.runtime} minutes`);
    $("#movieLanguage").text(data.language);

    // const screenings = [
    //   {
    //     cinema: "Cinema 1",
    //     theatre: "Theatre 1",
    //     datetime: "2025-01-01 10:00",
    //   },
    //   {
    //     cinema: "Cinema 2",
    //     theatre: "Theatre 2",
    //     datetime: "2025-01-01 12:00",
    //   },
    // ];

    const screenings = data.screenings;

    //   let data = await response.json();
    $("#screeningsList").empty();
    screenings.forEach(function (screening) {
        $("#screeningsList").append(`
        <article>
            <h2>${screening.cinema}</h2>
            <p>${screening.theatre}</p>
            <a href="/screening.html?screeningId=${screening.id}">Book</a>
        </article>  
        `);
    });

    // if (response.ok) {
    //     let data = await response.json();
    //     console.log(data);
    //     data.forEach(function (movie) {
    //         $(".movies").append(`
    //         <article>
    //             <h2>${movie.name}</h2>
    //             <a href="/movies.html?id=${movie._id}">[]</a>
    //         </article>
    //         `);
    //     });
    // } else {
    //     let err = await response.json();
    //     console.log(err.message);
    // }

    // $("#searchForm").on("submit",searchMovies);
});
