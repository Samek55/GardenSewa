import { Image, StyleSheet, Text, View } from "react-native";
import TeamCard from "../../components/TeamCard";
import { teams } from "../../data/servicesList";

export default function About() {
    return (
        <View style={styles.container}>
            <Image source={{
                uri: 'https://plus.unsplash.com/premium_photo-1689530775582-83b8abdb5020?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8cmFuZG9tJTIwcGVyc29ufGVufDB8fDB8fHww',
                width: '100%',
                height: '50%'
            }}
                style={styles.image}
            />
            <View style={styles.aboutUsContainer}>
                <Text style={styles.title}>About us</Text>
                <View style={styles.text}>
                    <Text>
                        Garden Sewa is a technology driven home service marketplace designed to connect customers with nearby professionals through real time location based marketing
                    </Text>
                </View>
                <View style={styles.text}>
                    <Text>
                        Garden Sewa is a technology driven home service marketplace designed to connect customers with nearby professionals through real time location based marketing
                    </Text>
                </View>
                <View style={styles.text}>
                    <Text>
                        Garden Sewa is a technology driven home service marketplace designed to connect customers with nearby professionals through real time location based marketing
                    </Text>
                </View>
            </View>
            <View style={{
                marginHorizontal: 8,
                marginTop:12
            }}>
                <Text style={styles.title}>Our Team</Text>
            </View>

            <View style={styles.teamsContainer}>
                {
                    teams?.map((team, key) => {
                        return (
                            <View key={key} style={{
                                height:120
                            }}>
                                <TeamCard name={team.name} imageUrl={team.url} position={team.position} />
                            </View>
                        )
                    })
                }
            </View>


        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 12,
        flex: 1,
        marginHorizontal: 12
    },
    image: {
        width: '100%',
        height: 200,
        borderRadius: 16,
        paddingHorizontal: 8
    },
    aboutUsContainer: {
        marginTop: 16,
        flex: 1,
        alignItems: 'flex-start',
        justifyContent: 'start',
        gap: 4,
        paddingHorizontal: 2
    },
    title: {
        fontSize: 20
    },
    text: {
        fontSize: 16
    },
    teamsContainer: {
        flex: 1,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        marginHorizontal:'auto',
        // backgroundColor:'red',
        marginBottom:18
    }

})
