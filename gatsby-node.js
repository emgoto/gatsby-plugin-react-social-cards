const { join } = require('path');
const puppeteer = require('puppeteer');
const glob = require('glob');

const DEFAULT_BASE_URL = 'http://localhost:8000';
const DEFAULT_IMAGE_FOLDER = 'static';
const DEFAULT_DIMENSIONS = [{
    width: 1200,
    height: 628,
    suffix: '-social-card'
}]
const DEFAULT_TIMEOUT = 5000;

async function timeoutFn(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const takeScreenshot = async (url, width, height, destination, timeout) => {    
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setViewport({
        width,
        height,
        deviceScaleFactor: 1,
    });
    await page.goto(url);
    await timeoutFn(timeout); // wait for page to finish loading
    await page.screenshot({
        path: destination,
        clip: {
            x: 0,
            y: 0,
            width,
            height,
        },
    });

    await browser.close();
};

const CACHE_KEY = 'socialCardPages'

exports.createPages = ({ cache, graphql, actions: { createPage }}, {
    query,
    queryToPages,
    imageFolder = DEFAULT_IMAGE_FOLDER,
    dimensions = DEFAULT_DIMENSIONS,
    component,
}) => {
    if (!process.env.gatsby_executing_command.includes('develop')) return;

    return graphql(query).then((result) => {
        const existingSocialCards = [];
        dimensions.forEach(dimension => {
            existingSocialCards.push(...glob.sync(join(process.cwd(), imageFolder, `*${dimension.suffix}.png`)));
        });

        const paths = [];
        queryToPages(result).forEach(({ slug, pageContext }) => {
            dimensions.forEach(({ height, width, suffix}) => {
                const path = `${slug}${suffix}`;
                const imagePath = join(process.cwd(), imageFolder, `${path}.png`);
    
                // Don't create page if image already exists
                if (existingSocialCards.indexOf(imagePath) === -1) {
                    createPage({
                        path,
                        component,
                        context: {...pageContext, width, height},
                    });
        
                    paths.push({ path, height, width })
                }
            })
        });

        if (paths.length > 0) {
            console.info(`Successfully created ${paths.length} social card pages. First one is ${paths[0].path}`);
        } else {
            console.info(`No social cards were created.`)
        }

        cache.set(CACHE_KEY, paths);
    });
}

exports.onCreateDevServer = (
    { cache }, { 
    cardLimit,
    baseUrl = DEFAULT_BASE_URL,
    imageFolder = DEFAULT_IMAGE_FOLDER,
    timeout = DEFAULT_TIMEOUT,
}) => {
    if (cardLimit === 0) {
        return;
    }

    console.info('Starting social card screenshots')

    cache.get(CACHE_KEY).then(async (socialCardPaths) => {
        let index = 0;
        for (const socialCardPath of socialCardPaths) {
            if (index === cardLimit) break;

            const { path, height, width } = socialCardPath;
            
            const destinationFile = join(
                process.cwd(),
                imageFolder,
                `${path}.png`,
            );

            try {
                console.info(`Taking screenshot of ${baseUrl}${path}`);
                await takeScreenshot(
                    `${baseUrl}${path}`,
                    width,
                    height,
                    destinationFile,
                    timeout
                );
                console.info('Successfully took screenshot of ', `${baseUrl}${path}`);
            } catch (e) {
                console.error('Taking screenshot failed', e);
            }

            index++;
        }
    });
}
