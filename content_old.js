let firstNotAppliedJob = null;
let firstLoadCompleted = false;

const MatchingData = {
  Applied: "Applied",
  WorkLocation: ["India (Remote)", "Jaipur, Rajasthan, India (On-site)", "Jaipur, Rajasthan, India (Remote)"],
  DismissedJob: "We won’t show you this job again.",
  JobTitle: [
    "ServiceNow",
    "Service Now",
    "Optimizely",
    "Intern",
    "Rust Developer",
    "Python Developer",
    "Data Scraping",
    "Data scrape",
    "Java Developer",
    "Java Software Engineer",
    "three.js developer",
    "tester",
    "sql developer",
    "database developer",
    "WPF developer",
    "yonder developer",
  ],
  CompanyName: ["Truelancer.com"],
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
  DismissedJob: ".job-card-container__footer-item--highlighted",
  JobTitle: ".job-card-list__title--link strong",
  CompanyName: ".job-card-container__primary-description",
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
    const dismissedJob = card.querySelector(QuerySelector.DismissedJob);
    const jobTitle = card.querySelector(QuerySelector.JobTitle);
    const companyName = card.querySelector(QuerySelector.JobTitle);

    if (
      (appliedBadge && appliedBadge.innerText.includes(MatchingData.Applied)) ||
      (workLocation && MatchingData.WorkLocation.every((x) => workLocation.innerText != x)) ||
      (dismissedJob && dismissedJob.innerText.includes(MatchingData.DismissedJob)) ||
      (jobTitle && MatchingData.JobTitle.some((x) => jobTitle.innerText.toLowerCase().indexOf(x.toLowerCase()) > -1)) ||
      (companyName && MatchingData.CompanyName.some((x) => companyName.innerText == x))
    ) {
      jobTitle && console.log("LinkedIn Hide > " + jobTitle.innerText);
      // Remove the job card
      card.remove();
      count++;
    } else {
      if (!firstNotAppliedJob) firstNotAppliedJob = card;
    }

    //Add that it is parsed to avoid parsing next time.
    card.classList.add(StaticText.IsAppliedParsed);
  });

  // console.log("LinkedIn Hide > Easy Applied: " + count);

  // Rerun the HideAppliedJobs function if there are jobs to be hidden.
  window.setTimeout(() => {
    jobCards = document.querySelectorAll(QuerySelector.JobCards + QuerySelector.NotParsed);
    if (jobCards.length > 0) hideAppliedJobs();
    else if (firstLoadCompleted == false) clickFirstJob();
  }, 1000);
}

function clickFirstJob() {
  window.scrollTo(window.scrollX, 0);
  const jobCardsScroller = document.querySelector(QuerySelector.JobCardsScroller);
  if (jobCardsScroller) jobCardsScroller.scrollTo(0, 0);

  window.setTimeout(() => {
    if (firstNotAppliedJob) firstNotAppliedJob.click();
    firstLoadCompleted = true;
  }, 500);
}

// Run the function when the page loads
window.addEventListener("load", function () {
  hideAppliedJobs();

  // Optionally, re-run the function when the user scrolls or interacts with the page
  const jobCardsScroller = document.querySelector(QuerySelector.JobCardsScroller);
  if (jobCardsScroller) jobCardsScroller.addEventListener("scrollend", hideAppliedJobs);
  document.addEventListener("click", hideAppliedJobs);
});
