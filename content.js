let firstNotAppliedJob = null;
let firstLoadCompleted = false;

// Function to hide jobs that have been applied to via Easy Apply
function hideAppliedJobs() {
  let count = 0;

  // Select all job cards
  let jobCards = document.querySelectorAll(".jobs-search-results__list-item:not(.is-applied-parsed)");

  jobCards.forEach((card) => {
    // Check if the job has been applied to via Easy Apply
    const appliedBadge = card.querySelector(".job-card-container__footer-item");

    if (appliedBadge && appliedBadge.innerText.includes("Applied")) {
      // Hide the job card
      // card.style.display = "none";
      card.remove();
      count++;
    } else {
      if (firstNotAppliedJob == null) firstNotAppliedJob = card;
    }

    //Add that it is parsed to avoid parsing next time.
    card.classList.add("is-applied-parsed");
  });

  console.log("LinkedIn Hide > Easy Applied: " + count);

  // Rerun the HideAppliedJobs function if there are jobs to be hidden.
  window.setTimeout(() => {
    if (firstLoadCompleted == false) {
      const jobCardsWrapper = document.querySelector(".jobs-search-results-list");
      jobCardsWrapper.scrollTop = 0;
    }
    jobCards = document.querySelectorAll(".jobs-search-results__list-item:not(.is-applied-parsed)");
    if (jobCards.length > 0) hideAppliedJobs();
    else if (firstLoadCompleted == false) clickFirstJob();
  }, 1000);
}

function clickFirstJob() {
  if (firstNotAppliedJob) {
    firstNotAppliedJob.click();
    firstLoadCompleted = true;
  }
}
// Run the function when the page loads
window.addEventListener("load", function () {
  hideAppliedJobs();

  // Optionally, re-run the function when the user scrolls or interacts with the page
  const jobCardsWrapper = document.querySelector(".jobs-search-results-list");
  if (jobCardsWrapper) jobCardsWrapper.addEventListener("scrollend", hideAppliedJobs);
  document.addEventListener("click", hideAppliedJobs);
});
