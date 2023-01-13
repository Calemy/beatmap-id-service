export let counter = {}

export default async function() {
    setInterval(async () => {
        counter = {}
    }, 60000)
}