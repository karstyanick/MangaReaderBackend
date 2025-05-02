export interface SaveJson {
    chapter: {
        [key: string]: {
            original: string
        }[]
    }
    page: {
        [key: string]: number
    },
    chapterNumber: {
        [key: string]: string
    },
    scrollPreference?: "horizontal" | "vertical"
}

export interface LinksJson {
    [key: string]: {
        poster: string
        [key: string]: string | {
            original: string
        }[]
    }
}

export type MangasDirectoryReturn = {
    label: string
    id: string
}[]
