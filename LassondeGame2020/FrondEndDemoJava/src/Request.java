
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;


public class Request {
	static String URL = "http://localhost:8081";

	@SuppressWarnings("unchecked")
	public static JSONObject makeRequest(String fullURL, String type) {
		JSONObject json = new JSONObject();
		try {
			URL obj = new URL(fullURL);
			HttpURLConnection con = (HttpURLConnection) obj.openConnection();
			con.setRequestMethod(type);

			if (type.equals("POST")) {
				con.setDoOutput(true);
				OutputStream os = con.getOutputStream();
				os.flush();
				os.close();
			}

			try (BufferedReader in = new BufferedReader(
					new InputStreamReader(con.getInputStream()))) {

				String line;
				StringBuilder response = new StringBuilder();

				while ((line = in.readLine()) != null) {
					response.append(line);
				}

				JSONParser parser = new JSONParser();
				json = (JSONObject) parser.parse(response.toString());
			}
		} catch (Exception e) {
			json.put("type", "Bad Request");
		}

		return json;

	}

	// Function checkError is used to print results from requests
	// 0 for error found, 1 for error not found, -1 for LocalHost not running
	private static int checkError(JSONObject result) {
		if (result.get("type").toString().equals("Bad Request")){
			System.out.println("Command failed. \n=============\n Bad Request \n=============");
			return -1;
		} else {
			String type_info = result.get("type").toString();
			System.out.println("type: <" + type_info + ">");
			if (!type_info.equals("SUCCESS")) {
				String errorMessage = (String) result.get("message");
				String errorType = (String) result.get("failure");
				System.out.println("Command failed: " + errorType + "\n=============\n" + errorMessage + "\n=============");
				return 0;
			}
			else {
				return 1;
			}
		}
	}

	// createInstace sets up the connection with the BackEnd
	@SuppressWarnings("unchecked")
	public static JSONObject createInstance() {
		// Check old instance data
		JSONObject json = new JSONObject();
		int errorExists = checkError(getInstance());
		// If error == -1 -> local host cannot be found
		if (errorExists == -1) {
			System.out.println("ERROR - Backend Instance Not Running");
			json.put("type", "Bad Request");
			return json;
		} else {
			if (errorExists == 0) {
				deleteInstance();
			}

			try {
				json = makeRequest(URL + "/instance", "POST");
			} catch (Exception e) {
				json.put("type", "ERROR");
			}

			return json;
		}
	}

	// Delete instance is used when creating a new instance
	// Ensures no previous connections exist
	public static JSONObject deleteInstance() {
		JSONObject json = makeRequest(URL + "/instance", "DELETE");
		checkError(json);

		return json;
	}
	
	
	// Gets the current Instance and all Information
	public static JSONObject getInstance() {
		return makeRequest(URL + "/instance", "GET");
	}


	// Gets a subset of information from the instance
	// Note: MapData includes asteroid locations, as well as mars and charging locations
	@SuppressWarnings("unchecked")
	public static JSONObject getData() {
		JSONObject r = new JSONObject();
		try {
			JSONObject rjson = getInstance();
			r = (JSONObject) rjson.get("mapData");
			r.put("mapData", rjson.get("payload"));


		} catch (Exception e) {
			r.put("type", "Bad Request");
		}
		return r;
	}

	// finish needs to be called to check if a successful landing
	// on Mars was completed
	@SuppressWarnings("unchecked")
	public static JSONObject finish() {
		JSONObject json = new JSONObject();
		try {
			json = makeRequest(URL + "/finish", "POST");
			checkError(json);
		} catch (Exception e) {
			json.put("type", "ERROR");
		}
		return json;
	}

	// Turn defines a new direction to spin the Rocket in
	// Turning Requires 1 fuel regardless of current orientation
	// except if no turn is required (ex. Facing North and turn North)
	public static void turn(String direction) {
		JSONObject r = getInstance();
		String facing = (String) ((JSONObject) r.get("payload")).get("direction");
		System.out.println("facing: " + facing + " direction: " + direction);
		if (!facing.equals(direction)) {
			facing = direction;
			String urlEnd = "/turn/" + direction.toString();
			JSONObject json = makeRequest(URL + urlEnd, "POST");
			checkError(json);
			r = getInstance();
			String facing_new = (String) ((JSONObject) r.get("payload")).get("direction");
			System.out.println("Now facing: " + (facing_new));
		}
	}

	// Move the rocket a certain number of spaces
	// move(number of times to move)
	public static void move(int amount) {
		for (int i = 0; i < amount; i++) {
			JSONObject r = makeRequest(URL + "/move", "POST");
			JSONObject inst = getInstance();
			Object location = ((JSONObject) inst.get("payload")).get("location");
			System.out.println("The rocket is at: " + location);
			int error = checkError(r);
			if (error == 0) {
				break;
			}
		}
	}

	// Refuel the rocket at one of the two station locations
	// Hint their coordinates are given in the instance data
	public static void refuel() {
		JSONObject r = makeRequest(URL + "/refuel", "POST");
		int  error = checkError(r);
		if (error == 1) {
			System.out.println("The rocket is refueled");
		}

	}

}
