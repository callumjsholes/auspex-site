import { SITE } from "./site";

// Title, description, and social cards for one public page.
// The image comes from the route's opengraph-image file, so it is not set here.
export function pageMeta({ title, description, path, image = "/opengraph-image" }) {
  const socialTitle = `${title} | ${SITE.name}`;
  const img = { url: image, width: 1200, height: 630, alt: "Auspex Sports record, graded at the posted price" };
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title: socialTitle, description, url: path, images: [img] },
    twitter: { card: "summary_large_image", title: socialTitle, description, images: [image] },
  };
}
