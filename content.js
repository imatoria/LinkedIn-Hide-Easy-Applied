let firstNotAppliedJob = null;
let firstLoadCompleted = false;

const MatchingData = {
  Applied: "Applied",
  WorkLocation: ["India (Remote)"],
};

const StaticText = {
  IsAppliedParsed: "is-applied-parsed",
};
const QuerySelector = {
  JobCardsScroller: ".jobs-search-results-list",
  JobCards: ".jobs-search-results__list-item",
  NotParsed: ":not(." + StaticText.IsAppliedParsed + ")",
  Applied: ".job-card-container__footer-item",
  WorkLocation: ".job-card-container__metadata-item",
};

// Function to hide jobs that have been applied to via Easy Apply
function hideAppliedJobs() {
  let count = 0;

  // Select all job cards
  let jobCards = document.querySelectorAll(QuerySelector.JobCards + QuerySelector.NotParsed);

  jobCards.forEach((card) => {
    // Check if the job has been applied to via Easy Apply
    const appliedBadge = card.querySelector(QuerySelector.Applied);
    const workLocation = card.querySelector(QuerySelector.WorkLocation);

    if (
      (appliedBadge && appliedBadge.innerText.includes(MatchingData.Applied)) ||
      (workLocation && MatchingData.WorkLocation.every((x) => workLocation.innerText != x))
    ) {
      // Remove the job card
      card.remove();
      count++;
    } else {
      if (!firstNotAppliedJob) firstNotAppliedJob = card;
    }

    //Add that it is parsed to avoid parsing next time.
    card.classList.add(StaticText.IsAppliedParsed);
  });

  console.log("LinkedIn Hide > Easy Applied: " + count);

  // Rerun the HideAppliedJobs function if there are jobs to be hidden.
  window.setTimeout(() => {
    jobCards = document.querySelectorAll(QuerySelector.JobCards + QuerySelector.NotParsed);
    if (jobCards.length > 0) hideAppliedJobs();
    else if (firstLoadCompleted == false) clickFirstJob();
  }, 1000);
}

function clickFirstJob() {
  window.scrollTo(window.scrollX, 0);
  document.querySelector(QuerySelector.JobCardsScroller).scrollTo(0, 0);

  window.setTimeout(() => {
    if (firstNotAppliedJob) firstNotAppliedJob.click();
    firstLoadCompleted = true;
  }, 500);
}

// Run the function when the page loads
window.addEventListener("load", function () {
  hideAppliedJobs();

  // Optionally, re-run the function when the user scrolls or interacts with the page
  const jobCardsScrollerr = document.querySelector(QuerySelector.JobCardsScroller);
  if (jobCardsScrollerr) jobCardsScrollerr.addEventListener("scrollend", hideAppliedJobs);
  document.addEventListener("click", hideAppliedJobs);
});
