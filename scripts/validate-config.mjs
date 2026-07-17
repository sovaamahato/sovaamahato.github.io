import { existsSync, readFileSync } from 'node:fs';

const config = JSON.parse(readFileSync('config.json', 'utf8'));
const errors = [];

function requireString(path, value) {
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${path} must be a non-empty string`);
  }
}

function isRemoteUrl(value) {
  return /^https?:\/\//i.test(value);
}

function checkAsset(path, value) {
  if (!value || isRemoteUrl(value)) return;
  if (!existsSync(value)) {
    errors.push(`${path} points to a missing asset: ${value}`);
  }
}

requireString('github_username', config.github_username);
requireString('header.greeting', config.header?.greeting);
requireString('header.tagline', config.header?.tagline);
requireString('site.seo.title', config.site?.seo?.title);
requireString('site.seo.description', config.site?.seo?.description);
requireString('site.seo.base_url', config.site?.seo?.base_url);

if (!Array.isArray(config.social_links) || config.social_links.length === 0) {
  errors.push('social_links must include at least one link');
}

if (!Array.isArray(config.about?.paragraphs)) {
  errors.push('about.paragraphs must be an array');
}

if (config.features?.why_hire) {
  requireString('why_hire.title', config.why_hire?.title);
  requireString('why_hire.intro', config.why_hire?.intro);

  if (!Array.isArray(config.why_hire?.items) || config.why_hire.items.length === 0) {
    errors.push('why_hire.items must include at least one FAQ item when why_hire is enabled');
  }
}

config.why_hire?.items?.forEach((item, index) => {
  requireString(`why_hire.items[${index}].question`, item.question);
  requireString(`why_hire.items[${index}].answer`, item.answer);
});

config.projects?.items?.forEach((project, index) => {
  requireString(`projects.items[${index}].name`, project.name);
  checkAsset(`projects.items[${index}].picture`, project.picture);
});

config.experience?.jobs?.forEach((job, index) => {
  requireString(`experience.jobs[${index}].company`, job.company);
  requireString(`experience.jobs[${index}].role`, job.role);
  checkAsset(`experience.jobs[${index}].logo`, job.logo);
  checkAsset(`experience.jobs[${index}].logo_dark`, job.logo_dark);
});

if (config.features?.education && !Array.isArray(config.education?.items)) {
  errors.push('education.items must be an array when education is enabled');
}

if (config.features?.cv) {
  requireString('cv.title', config.cv?.title);
  requireString('cv.description', config.cv?.description);
  requireString('cv.file', config.cv?.file);
  checkAsset('cv.file', config.cv?.file);
}

config.education?.items?.forEach((item, index) => {
  requireString(`education.items[${index}].institution`, item.institution);
  requireString(`education.items[${index}].qualification`, item.qualification);
  requireString(`education.items[${index}].date`, item.date);
});

if (config.github_projects?.mode && !['featured', 'stars', 'feed'].includes(config.github_projects.mode)) {
  errors.push('github_projects.mode must be one of: featured, stars, feed');
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('config.json is valid.');
