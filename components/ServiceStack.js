import { Image, StyleSheet, Text, View } from 'react-native'


const ServiceStack = ({ imageSource, description, title }) => {
    console.log(imageSource)
    return (
        <View style={styles.container}>

            <View style={styles.imageContainer}>
                <Image
                    source={{ uri: imageSource }}
                    width={100}
                    height={100}
                />
            </View>
            <View style={styles.textContainer}>
                <Text style={{
                    fontSize:18,
                }}>{title}</Text>
                <Text>{description}</Text>
            </View>

        </View>
    )
}

const styles = StyleSheet.create({

    textContainer: {
        flex: 3,
        gap: 2

    },

    imageContainer: {
        width: 100,
        height: 100,
    },
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        padding :2,
        margin:'auto',
        backgroundColor: '#ffffff',
        borderBlockColor: '#828181',
        borderWidth: 0.5
    }
})

export default ServiceStack
