
import { Image, StyleSheet, Text, View } from 'react-native'

const TeamCard = ({ imageUrl, name, position }) => {
    // console.log(imageUrl)
    return (
        <View style={styles.container}>
            <View style={styles.container}>
                <Image
                    source={{ uri: imageUrl }}
                    style={styles.image}
                />
            </View>
            <Text>{name}</Text>
            <Text>{position}</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom:8,
        gap:2
    },
    image: {
        width: 80,
        height: 80,
        borderRadius:40,
        borderColor:"#636363",
        borderWidth:1
    },
    imageContainer: {
        width: 100,
        height: 100,
    }
})

export default TeamCard
