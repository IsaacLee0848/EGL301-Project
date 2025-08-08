$(async function () {

    let response = await fetch("/api/movies/search", {
        method: "post",
        body: JSON.stringify({
            movieName: "",
        }),
        headers: {
            "Content-Type": "application/json",
            Authorization: sessionStorage.getItem("token")
        }
    });
    if (response.ok) {
        let data = await response.json();
        console.log(data);
        data.forEach(function (movie) {
            $(".movies").append(`
            <article>
                <h2>${movie.name}</h2>
                <a href="/searchMovies.html?movieId=${movie._id}">More Info</a>
            </article>  
            `);
        });
    } else {
        let err = await response.json();
        console.log(err.message);
    }


    $("#searchForm").on("submit",searchMovies);
})

async function searchMovies(e) {
    e.preventDefault();
    let data = new FormData(e.target);
    let nowShowing = Object.fromEntries(data.entries());
    let response = await fetch("/api/movies/search", {
        method: "post",
        body: JSON.stringify(nowShowing),
        headers: {
            "Content-Type": "application/json",
            Authorization: sessionStorage.getItem("token")
        }
    });
    if (response.ok) {
        let data = await response.json();
        $(".movies").empty();
        data.forEach(function (movie) {
            $(".movies").append(`
            <article>
                <h2>${movie.name}</h2>
                <a href="/searchMovies.html?movieId=${movie._id}">More Info</a>
            </article>  
            `);
        });
    } else {
        let err = await response.json();
        console.log(err.message);
    }
    
}