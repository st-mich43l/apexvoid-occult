export function validateTopicCoverage(data: any) {
  if (data.topics.length !== 28) throw new Error("Must have exactly 28 topics");
  return true;
}