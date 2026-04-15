<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" 
                xmlns:html="http://www.w3.org/TR/REC-html40"
                xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
	<xsl:template match="/">
		<html xmlns="http://www.w3.org/1999/xhtml">
		<head>
			<title>XML Sitemap | Reflections</title>
			<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
			<style type="text/css">
				body {
					font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
					font-size: 14px;
					color: #121212;
					background-color: #f8fafc;
					margin: 0;
					padding: 20px;
				}
				.container {
					max-width: 900px;
					margin: 0 auto;
					background: #ffffff;
					padding: 40px;
					border-radius: 24px;
					box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
					border: 2px solid #e2e8f0;
				}
				h1 {
					color: #121212;
					font-size: 32px;
					font-weight: 900;
					letter-spacing: -0.025em;
					margin-bottom: 8px;
					text-transform: lowercase;
				}
				p.description {
					color: #64748b;
					margin-bottom: 40px;
					font-weight: 500;
				}
				.header-accent {
					height: 60px;
					width: 60px;
					background-color: #58CC02;
					border-radius: 16px;
					margin-bottom: 24px;
					box-shadow: 0 4px 0 0 #46a302;
					display: flex;
					align-items: center;
					justify-content: center;
					color: white;
					font-size: 24px;
				}
				table {
					width: 100%;
					border-collapse: collapse;
				}
				th {
					text-align: left;
					padding: 12px 16px;
					background: #f1f5f9;
					color: #475569;
					font-weight: 900;
					text-transform: uppercase;
					letter-spacing: 0.1em;
					font-size: 11px;
					border-bottom: 2px solid #e2e8f0;
				}
				td {
					padding: 16px;
					border-bottom: 1px solid #f1f5f9;
					color: #334155;
					font-weight: 600;
				}
				tr:hover td {
					background-color: #f8fafc;
				}
				a {
					color: #58CC02;
					text-decoration: none;
					font-weight: 700;
				}
				a:hover {
					text-decoration: underline;
				}
				.footer {
					margin-top: 40px;
					text-align: center;
					color: #94a3b8;
					font-size: 11px;
					font-weight: 800;
					text-transform: uppercase;
					letter-spacing: 0.1em;
				}
			</style>
		</head>
		<body>
			<div class="container">
				<div class="header-accent">✨</div>
				<h1>xml sitemap</h1>
				<p class="description">This is the search engine index for Reflections. It lists the public pages that are discoverable on the web.</p>
				
				<table>
					<thead>
						<tr>
							<th>URL</th>
							<th>Priority</th>
							<th>Change Freq</th>
							<th>Last Modified</th>
						</tr>
					</thead>
					<tbody>
						<xsl:for-each select="sitemap:urlset/sitemap:url">
							<tr>
								<td>
									<xsl:variable name="itemURL">
										<xsl:value-of select="sitemap:loc"/>
									</xsl:variable>
									<a href="{$itemURL}">
										<xsl:value-of select="sitemap:loc"/>
									</a>
								</td>
								<td>
									<xsl:value-of select="concat(sitemap:priority*100,'%')"/>
								</td>
								<td>
									<xsl:value-of select="sitemap:changefreq"/>
								</td>
								<td>
									<xsl:value-of select="sitemap:lastmod"/>
								</td>
							</tr>
						</xsl:for-each>
					</tbody>
				</table>
				
				<div class="footer">
					Reflections — Your thoughts, protected.
				</div>
			</div>
		</body>
		</html>
	</xsl:template>
</xsl:stylesheet>
