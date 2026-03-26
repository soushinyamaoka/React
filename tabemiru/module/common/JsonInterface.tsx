export interface HomeJson {
    siteInfo: SiteInfo;
    recipeInfo: RecipeInfo[];
}

export interface SiteInfo {
    nav: Nav;
}

export interface RecipeInfo {
    title: string;
    videos: Videos[];
}

export interface Nav {
    name: string;
    link: string;
}

export interface Videos {
    id: string;
    title: string;
}

const nav: Nav = {
    name: '',
    link: ''
}

const videos: Videos = {
    id: '',
    title: ''
}

const recipeInfo: RecipeInfo = {
    title: '12345',
    videos: [videos]
}

const siteInfo: SiteInfo = {
    nav: nav
}

export class HomeJsonInit {
    private homeJson: HomeJson = {
        siteInfo: siteInfo,
        recipeInfo: [recipeInfo]
    }

    public getIniHomeJson(): HomeJson {
        return this.homeJson;
    }
}
