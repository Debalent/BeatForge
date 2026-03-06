// Utility to load demo project data
export async function loadDemoProject() {
  const res = await fetch('/beatforge/demo/guided-product-tour/demoProject.json');
  if (!res.ok) throw new Error('Failed to load demo project');
  return await res.json();
}
