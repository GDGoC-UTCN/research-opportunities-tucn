/*
 * Transparent, rule-based opportunity recommendations (no external AI).
 * Scores candidate opportunities against a student's stated interests, skills,
 * preferred tags, and the tags of opportunities they saved/applied to, and
 * returns human-readable reasons for each match.
 */

function normalizeTerms(list) {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  const out = [];
  for (const raw of list) {
    const term = String(raw || '').trim();
    if (!term) continue;
    const key = term.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ display: term, key });
  }
  return out;
}

function daysSince(value) {
  if (!value) return Infinity;
  const t = new Date(value).getTime();
  if (Number.isNaN(t)) return Infinity;
  return (Date.now() - t) / (1000 * 60 * 60 * 24);
}

/**
 * @param {object} input
 * @param {string[]} input.interests   student research interests
 * @param {string[]} input.skills      student skills
 * @param {string[]} input.preferredTags student preferred tags
 * @param {Set<string>} input.savedTags  lowercased tags of saved opportunities
 * @param {Set<string>} input.appliedTags lowercased tags of applied opportunities
 * @param {Set<string>} input.rejectedOpportunityIds  ids to de-prioritize
 * @param {Array} input.opportunities  candidate opportunities ({ id, title, description, tags[] , created_at })
 * @returns {Array<{ opportunity, score, reasons }>} sorted by score desc
 */
function scoreOpportunities({
  interests = [],
  skills = [],
  preferredTags = [],
  savedTags = new Set(),
  appliedTags = new Set(),
  rejectedOpportunityIds = new Set(),
  opportunities = [],
}) {
  const interestTerms = normalizeTerms([...interests, ...preferredTags]);
  const skillTerms = normalizeTerms(skills);

  const results = [];

  for (const opp of opportunities) {
    const oppTags = (Array.isArray(opp.tags) ? opp.tags : []).map(t => String(t).toLowerCase());
    const oppText = `${opp.title || ''} ${opp.description || ''} ${oppTags.join(' ')}`.toLowerCase();

    let score = 0;
    const interestReasons = [];
    const skillReasons = [];
    const otherReasons = [];

    // Interest / preferred-tag matches (strongest signal).
    for (const term of interestTerms) {
      const tagHit = oppTags.some(tag => tag === term.key || tag.includes(term.key) || term.key.includes(tag));
      if (tagHit) {
        score += 3;
        interestReasons.push(`Matches your interest in ${term.display}`);
      } else if (oppText.includes(term.key)) {
        score += 2;
        interestReasons.push(`Mentions ${term.display}`);
      }
    }

    // Skill matches.
    for (const term of skillTerms) {
      if (oppText.includes(term.key)) {
        score += 2;
        skillReasons.push(`Uses ${term.display}`);
      }
    }

    // Behavioral signals from saved / applied opportunity tags.
    if (oppTags.some(tag => savedTags.has(tag))) {
      score += 2;
      otherReasons.push('Similar to opportunities you saved');
    }
    if (oppTags.some(tag => appliedTags.has(tag))) {
      score += 1;
      otherReasons.push('Similar to opportunities you applied to');
    }

    // Freshness boost.
    if (daysSince(opp.created_at) <= 21) {
      score += 1;
      otherReasons.push('Recently posted');
    }

    // De-prioritize opportunities tied to a rejected application's tags.
    if (rejectedOpportunityIds.has(String(opp.id))) {
      score -= 2;
    }

    if (score <= 0) continue;

    const reasons = [...interestReasons, ...skillReasons, ...otherReasons].slice(0, 3);
    results.push({ opportunity: opp, score, reasons });
  }

  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return daysSince(a.opportunity.created_at) - daysSince(b.opportunity.created_at);
  });

  return results;
}

module.exports = { scoreOpportunities, normalizeTerms };
