import { Outlet } from "react-router";
import { Footer, Header } from "~/components/Layout";
import { JsonLd } from "~/components/JsonLd";
import { organizationSchema, websiteSchema } from "~/seo/jsonld";

export default function SiteLayout() {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2">
        Skip to content
      </a>
      <Header />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
      <JsonLd data={[organizationSchema(), websiteSchema()]} />
    </>
  );
}
