// src/modules/colleges/recommendation.engine.js
//
// This replaces the old single-rule "if rank < X then minRating = Y" logic
// with a transparent, multi-factor weighted scoring model. It's not a
// trained ML model (be honest about that in interviews — see the audit doc
// for how to extend this to a real model later), but it IS a legitimate
// multi-signal recommendation engine you can defend in a system design
// interview: clear inputs, explainable weights, deterministic output.
//
// Score (0-100) = weighted sum of normalized sub-scores:
//   admissionChance   35%  — how comfortably the user's rank clears the
//                            college's historical closing rank
//   branchMatch       20%  — overlap with user's preferred branches
//   budgetFit         15%  — how well fees fit the user's stated budget
//   placementStrength 15%  — normalized package + placement rate
//   reputationScore   10%  — normalized NIRF rank + rating
//   locationMatch      5%  — overlap with preferred cities

function admissionChanceScore(userRank, closingRank) {
  if (!closingRank) return 50; // no data — neutral score
  const ratio = closingRank / userRank;
  if (ratio >= 1.5) return 100; // very safe
  if (ratio >= 1.1) return 85; // safe
  if (ratio >= 0.95) return 65; // borderline
  if (ratio >= 0.8) return 35; // ambitious/reach
  return 10; // unlikely
}

function branchMatchScore(collegeBranches = [], preferredBranches = []) {
  if (preferredBranches.length === 0) return 60; // neutral if no preference given
  const overlap = collegeBranches.filter((b) =>
    preferredBranches.some((p) => b.toLowerCase().includes(p.toLowerCase()))
  );
  return overlap.length > 0 ? 100 : 20;
}

function budgetFitScore(fees, maxBudget) {
  if (!maxBudget || !fees) return 60;
  if (fees <= maxBudget) return 100;
  const overBy = (fees - maxBudget) / maxBudget;
  return Math.max(0, Math.round(100 - overBy * 150));
}

function placementStrengthScore(avgPackage, placementRate) {
  const packageScore = avgPackage ? Math.min(100, (avgPackage / 2000000) * 100) : 50; // 20L = saturating
  const rateScore = placementRate ?? 50;
  return Math.round((packageScore + rateScore) / 2);
}

function reputationScore(nirfRank, rating) {
  const rankScore = nirfRank ? Math.max(0, 100 - nirfRank) : 50; // rank 1 = 99, rank 100 = 0
  const ratingScore = rating ? (rating / 5) * 100 : 50;
  return Math.round((rankScore + ratingScore) / 2);
}

function locationMatchScore(city, preferredCities = []) {
  if (preferredCities.length === 0) return 60;
  return preferredCities.some((c) => c.toLowerCase() === city.toLowerCase()) ? 100 : 30;
}

const WEIGHTS = {
  admissionChance: 0.35,
  branchMatch: 0.2,
  budgetFit: 0.15,
  placementStrength: 0.15,
  reputation: 0.1,
  location: 0.05,
};

function scoreCollege(college, input) {
  const closingRank = college.cutoffs?.[0]?.closingRank;

  const sub = {
    admissionChance: admissionChanceScore(input.rank, closingRank),
    branchMatch: branchMatchScore(college.branches, input.branchPreferences),
    budgetFit: budgetFitScore(college.fees, input.maxBudget),
    placementStrength: placementStrengthScore(college.avgPackage, college.placementRate),
    reputation: reputationScore(college.nirfRank, college.rating),
    location: locationMatchScore(college.city, input.cityPreferences),
  };

  const totalScore = Math.round(
    sub.admissionChance * WEIGHTS.admissionChance +
      sub.branchMatch * WEIGHTS.branchMatch +
      sub.budgetFit * WEIGHTS.budgetFit +
      sub.placementStrength * WEIGHTS.placementStrength +
      sub.reputation * WEIGHTS.reputation +
      sub.location * WEIGHTS.location
  );

  let band = "Reach";
  if (sub.admissionChance >= 85) band = "Safe";
  else if (sub.admissionChance >= 65) band = "Moderate";
  else if (sub.admissionChance >= 35) band = "Ambitious";

  return {
    collegeId: college.id,
    name: college.name,
    city: college.city,
    matchScore: totalScore,
    admissionBand: band,
    breakdown: sub,
  };
}

// `candidates` = colleges already filtered to the relevant exam/category
// (see collegesRepository.findCandidatesForPredictor)
function recommendColleges(candidates, input) {
  return candidates
    .map((college) => scoreCollege(college, input))
    .sort((a, b) => b.matchScore - a.matchScore);
}

module.exports = { recommendColleges, scoreCollege };
