const word = document.querySelector('#word')

const words = ['Informático','Desarrollador Web','Programador']

let wordsIndex = 0
let characterIndex = 0

updateWord()

function updateWord(){
    characterIndex++
    word.textContent = `${words[wordsIndex].slice(0,characterIndex)}`

    if (characterIndex === words[wordsIndex].length){
        wordsIndex++
        characterIndex = 0
    }

    if (wordsIndex === words.length) {
        wordsIndex = 0
    }

    setTimeout(updateWord, 400)
    
}
