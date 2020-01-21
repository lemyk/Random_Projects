import java.util.HashMap;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Objects;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;

public class MainClass {

	public static void main(String[] args) throws Exception {
		JSONObject request = Request.createInstance();
		JSONObject map = Request.getData();
		System.out.println(map);
		
		//Mars coord
		JSONObject mars_coord = (JSONObject) map.get("Mars");
		Long mars_x_coor = (Long) mars_coord.get("x");
		Long mars_y_coor = (Long) mars_coord.get("y");
		
		//Stations
		JSONObject s1_coord = (JSONObject) map.get("Station1");
		Long s1_x_coor = (Long) s1_coord.get("x");
		Long s1_y_coor = (Long) s1_coord.get("y");
		
		JSONObject s2_coord = (JSONObject) map.get("Station2");
		Long s2_x_coor = (Long) s2_coord.get("x");
		Long s2_y_coor = (Long) s2_coord.get("y");
		
		//Get next destination
		Long dis_Mars = getDistance(mars_x_coor, mars_y_coor);
		Long dis_S1 = getDistance(s1_x_coor, s1_y_coor);
		Long dis_S2 = getDistance(s2_x_coor, s2_y_coor);
		
		Map<JSONObject, Long> dest_mapping = new HashMap<JSONObject, Long>();	
		dest_mapping.put(mars_coord, dis_Mars);
		dest_mapping.put(s1_coord, dis_S1);
		dest_mapping.put(s2_coord, dis_S2);
		
		//shortest distance from current loc to next destination
		Long min_des = Math.min(dis_Mars, Math.min(dis_S1, dis_S2));
		JSONObject dest_key = new JSONObject();
		for(Entry<JSONObject, Long> entry: dest_mapping.entrySet()) {
			if (Objects.equals(min_des, entry.getValue())) {
				dest_key = entry.getKey();
	        }
		}
		
		//Coordinators of next destination
		Long dest_x = (Long) dest_key.get("x");
		Long dest_y = (Long) dest_key.get("y");
		
		//Asteroids XY
		JSONArray aster = (JSONArray) map.get("Asteroids");
		Long[] aster_x_array = new Long[aster.size()];
		Long[] aster_y_array = new Long[aster.size()];
		for(int i = 0; i < aster.size(); i++) {
			JSONObject jsonobj_2 = (JSONObject) aster.get(i);
	     	Long asterx = (Long) jsonobj_2.get("x");
	     	Long astery = (Long) jsonobj_2.get("y");
	     	aster_x_array[i] = asterx;
	     	aster_y_array[i] = astery;
		}
		
		//current location of rocket
		Long[] current_loc = new Long[2];
		current_loc = getRocketLocation();		
		
		//directions
			while(current_loc[1] < dest_y) {
				freeToMove(current_loc[0], current_loc[1], aster_x_array, aster_y_array);
				current_loc = getRocketLocation();			
			}
			Request.turn("E");
			while(current_loc[0] < dest_x) {
				freeToMove(current_loc[0], current_loc[1], aster_x_array, aster_y_array);
				current_loc = getRocketLocation();			
			}
			Request.refuel();	
			
			//direction no next destination
			if(current_loc[0] == mars_x_coor && current_loc[1] == mars_y_coor) {
				Request.finish();
			}
			else {				
				dis_Mars = getDistance(mars_x_coor - current_loc[0], mars_y_coor - current_loc[1]);
				Long dis_Station = (long) 0;
				Map<JSONObject, Long> dest_mapping2 = new HashMap<JSONObject, Long>();
				dest_mapping2.put(mars_coord, dis_Mars);
				
				//check if current is station 1
				if(current_loc[0] == s1_x_coor && current_loc[1] == s1_y_coor) {					
					dis_Station = getDistance(s2_x_coor - current_loc[0], s2_x_coor - current_loc[1]);
					dest_mapping2.put(s2_coord, dis_Station);
				}
				else {
					dis_Station = getDistance(s1_x_coor - current_loc[0], s1_x_coor - current_loc[1]);
					dest_mapping2.put(s1_coord, dis_Station);
				}									
				
				min_des = Math.min(dis_Mars, dis_Station);
				JSONObject dest_key2 = new JSONObject();
				for(Entry<JSONObject, Long> entry: dest_mapping2.entrySet()) {
					if (Objects.equals(min_des, entry.getValue())) {
						dest_key2 = entry.getKey();
			        }
				}
				
				dest_x = (Long) dest_key2.get("x");
				dest_y = (Long) dest_key2.get("y");
				//move to next dest
				while(current_loc[0] < dest_x) {
					freeToMove(current_loc[0], current_loc[1], aster_x_array, aster_y_array);
					current_loc = getRocketLocation();			
				}
				Request.turn("N");
				while(current_loc[1] < dest_y) {
					freeToMove(current_loc[0], current_loc[1], aster_x_array, aster_y_array);
					current_loc = getRocketLocation();			
				}
				//check if current is mars
				if(current_loc[0] == mars_x_coor && current_loc[1] == mars_y_coor) {
					Request.finish();
				}
				else {
					//check movements till Mars
					Long extra_fuel = (long) 0;
					for(Long y = current_loc[1]; y <= mars_y_coor; y++) {
						if(!checkAsteroid(current_loc[0], y, aster_x_array, aster_y_array)) 
							extra_fuel += 8;
						
					}
					for(Long x = current_loc[0]; x <= mars_x_coor; x++) {
						if(!checkAsteroid(x, mars_y_coor, aster_x_array, aster_y_array)) 
							extra_fuel += 8;
						
					}
					System.out.println(extra_fuel);
					Long move_length = mars_x_coor - current_loc[0] + mars_y_coor - current_loc[1] + 2 + extra_fuel;
					System.out.println(move_length);
					JSONObject r_fuel = (JSONObject) Request.getData().get("mapData");
					Long fuel = (Long) r_fuel.get("fuelAmount");
					if(fuel < move_length) {
						Request.refuel();
						//move to Mars
						while(current_loc[1] < mars_y_coor) {
							freeToMove(current_loc[0], current_loc[1], aster_x_array, aster_y_array);
							current_loc = getRocketLocation();			
						}
						Request.turn("E");
						while(current_loc[0] < mars_x_coor) {
							freeToMove(current_loc[0], current_loc[1], aster_x_array, aster_y_array);
							current_loc = getRocketLocation();			
						}
						if(current_loc[0] == mars_x_coor && current_loc[1] == mars_y_coor) {
							Request.finish();
						}
					}
					else {
						//direction to Mars
						if(current_loc[0] == mars_x_coor && current_loc[1] == mars_y_coor) {
							Request.finish();
						}
						else {
							//move to Mars
							while(current_loc[1] < mars_y_coor) {
								freeToMove(current_loc[0], current_loc[1], aster_x_array, aster_y_array);
								current_loc = getRocketLocation();			
							}
							Request.turn("E");
							while(current_loc[0] < mars_x_coor) {
								freeToMove(current_loc[0], current_loc[1], aster_x_array, aster_y_array);
								current_loc = getRocketLocation();			
							}
							if(current_loc[0] == mars_x_coor && current_loc[1] == mars_y_coor) {
								Request.finish();
							}
						}
					}	
				}
				}
	}
	
	public static Long[] getRocketLocation() {
		//Get loccation
		JSONObject r_map = (JSONObject) Request.getData().get("mapData");
		JSONObject r_loc = (JSONObject) r_map.get("location");
		Long roc_locx = (Long) r_loc.get("x");
		Long roc_locy = (Long) r_loc.get("y");
		Long[] curr_loc = new Long[2];
		curr_loc[0] = roc_locx;
		curr_loc[1] = roc_locy;
		return curr_loc;
	}
	
	public static void freeToMove(Long locx, Long locy, Long[] ax, Long[] ay) {
		JSONObject r = Request.getInstance();
		String facing = (String) ((JSONObject) r.get("payload")).get("direction");
		JSONObject r_fuel = (JSONObject) Request.getData().get("mapData");
		Long fuel = (Long) r_fuel.get("fuelAmount");
		if(fuel < 0)
			Request.finish();
		switch(facing) {
		case "N":
			if(checkAsteroid(locx, locy + 1, ax, ay))
				Request.move(1);
			else{
				Request.turn("E");
				Request.move(1);
				Request.turn("N");
				Request.move(2);
				Request.turn("W");
				Request.move(1);
				Request.turn("N");
			}
			break;
		case "S":
			if(checkAsteroid(locx, locy - 1, ax, ay))
				Request.move(1);
			else{
				Request.turn("E");
				Request.move(1);
				Request.turn("S");
				Request.move(2);
				Request.turn("W");
				Request.move(1);
				Request.turn("S");
			}
			break;
		case "E":
			if(checkAsteroid(locx + 1, locy, ax, ay))
				Request.move(1);
			else {
				Request.turn("N");
				Request.move(1);
				Request.turn("E");
				Request.move(2);
				Request.turn("S");
				Request.move(1);
				Request.turn("E");
			}
			break;
		case "W":
			if(checkAsteroid(locx - 1, locy, ax, ay))
				Request.move(1);
			else{
				Request.turn("N");
				Request.move(1);
				Request.turn("W");
				Request.move(2);
				Request.turn("S");
				Request.move(1);
				Request.turn("W");
			}
			break;
		default:
			break;
		}
		
	}

	public static boolean checkAsteroid(Long locx, Long locy, Long[] ax, Long[] ay) {
		for(int i = 0; i < ax.length; i++) {
			if(locx == ax[i] && locy == ay[i]) {
				return false;
			}
		}
		return true;
	}
	
	public static Long getDistance(Long x, Long y) {
		return x + y;
	}
}
