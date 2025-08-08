const token = 
    "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmYjVmMDkxOWMzZDQ1MGUwMGFlMThkMDE3YThmZmQ2NiIsIm5iZiI6MTc1NDExNDU1NC44MjQsInN1YiI6IjY4OGRhOWZhOGJmMjVhZmMyZjdjZWYwMSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.VgOwVEq_UZ8VM8hTdvQmGyOcP2u2mrHAA69-dDrr7_g";
const url = 
    "https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=en-US&page=1&sort_by=popularity.desc";

$(async function () {
    const response = await fetch(url, {
        method: "GET",
        headers: {
            accept: "application/json",
            Authorization: `Bearer ${token}`
        }
    });
    console.log(response);

    if (response.ok) {
        let data = await response.json();
        console.log(data);
        data.results.forEach(function (movie) {
            $(".movies").append(`
                <article>
                    <h2>${movie.original_title}</h2>
                    <p>${movie.original_language}</p>
                    <p>${movie.release_date}</p>
                </article>
                `);
        });
    } else {
        let err = await response.json();
        console.log(err.message);
    }

    $("#searchForm").on("submit", searchMovies);
});